// Rewrites `t('Natural text', …)` into `t('namespaced.key', 'Natural text', …)` using the
// reviewed mapping. Edits are collected with AST positions and applied right-to-left so
// offsets stay valid. Prettier normalises quoting afterwards.
//
// Non-literal call forms (t(cond ? 'a' : 'b'), t(x || 'a'), and the notification-translator
// option objects) are reported and left alone — they are handled by hand.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const mapping = JSON.parse(
  fs.readFileSync('scripts/i18n-migration/key-map.json', 'utf8'),
).keys;
const en = JSON.parse(fs.readFileSync('src/i18n/en.json', 'utf8'));

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'mock-builders') continue;
      walk(p);
    } else if (/\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) files.push(p);
  }
})('src');

// The inline default is the English *value*, not the key: `aria/Send` renders as "Send".
const defaultFor = (oldKey) => en[oldKey] ?? oldKey.replace(/^aria\//, '');
const pluralDefaults = (oldKey) => ({
  one: en[`${oldKey}_one`],
  other: en[`${oldKey}_other`],
});

const lit = (s) => JSON.stringify(s);

const isTCallee = (expr) =>
  (ts.isIdentifier(expr) && expr.text === 't') ||
  (ts.isPropertyAccessExpression(expr) && expr.name.text === 't');

let rewritten = 0;
let skipped = [];
const touchedFiles = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const edits = [];

  const visit = (node) => {
    if (ts.isCallExpression(node) && isTCallee(node.expression)) {
      const [arg0, ...rest] = node.arguments;
      if (arg0 && ts.isStringLiteralLike(arg0)) {
        const oldKey = arg0.text;
        const entry = mapping[oldKey];
        if (entry) {
          const newKey = entry.key;
          if (!entry.prose) {
            // Formatter/plumbing key: swap the key, leave everything else alone.
            edits.push({
              start: arg0.getStart(sf),
              end: arg0.getEnd(),
              text: lit(newKey),
            });
          } else if (entry.plural) {
            const { one, other } = pluralDefaults(oldKey);
            if (one === undefined || other === undefined) {
              skipped.push({
                file,
                key: oldKey,
                why: 'plural defaults missing from en.json',
              });
            } else {
              const defaults = `defaultValue_one: ${lit(one)}, defaultValue_other: ${lit(other)}`;
              const opts = rest[0];
              if (opts && ts.isObjectLiteralExpression(opts)) {
                // Merge the defaults into the existing options object.
                edits.push({
                  start: arg0.getStart(sf),
                  end: arg0.getEnd(),
                  text: lit(newKey),
                });
                const inner = opts.properties.length
                  ? `${opts.properties.map((p) => p.getText(sf)).join(', ')}, ${defaults}`
                  : defaults;
                edits.push({
                  start: opts.getStart(sf),
                  end: opts.getEnd(),
                  text: `{ ${inner} }`,
                });
              } else if (!opts) {
                skipped.push({
                  file,
                  key: oldKey,
                  why: 'plural key called without options',
                });
              } else {
                skipped.push({
                  file,
                  key: oldKey,
                  why: 'plural options not an object literal',
                });
              }
            }
          } else {
            // Singular prose: insert the English copy as a positional defaultValue.
            edits.push({
              start: arg0.getStart(sf),
              end: arg0.getEnd(),
              text: `${lit(newKey)}, ${lit(defaultFor(oldKey))}`,
            });
          }
        } else {
          skipped.push({ file, key: oldKey, why: 'no mapping entry' });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  rewritten += edits.length;
  touchedFiles.push(file);
  if (!DRY) fs.writeFileSync(file, out);
}

console.log(DRY ? '(dry run)' : '(applied)');
console.log('edits:', rewritten, 'in', touchedFiles.length, 'files');
console.log('skipped:', skipped.length);
for (const s of skipped) console.log(`  ${s.file}  ${JSON.stringify(s.key)}  — ${s.why}`);
