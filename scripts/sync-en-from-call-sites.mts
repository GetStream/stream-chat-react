// Makes the inline English copy at each `t()` call site authoritative for `src/i18n/en.json`.
//
// Why this exists: `i18next-cli extract` only *adds* keys — it deliberately never overwrites an
// existing value, which is right for translated locales but wrong for the source language. Without
// this step, editing the copy in a component has no visible effect (en.json is bundled and wins
// for `en`), and the drift gate stays green. That is a silent-divergence footgun.
//
// Handles the three call shapes the SDK uses:
//   t('key', 'Copy')                              -> en['key'] = 'Copy'
//   t('key', { defaultValue_one, defaultValue_other, count })  -> en['key_one'], en['key_other']
//   t('key', { … })  with no default              -> left alone (formatter/plumbing keys)
// Keys built from a runtime value (`t(asDynamicKey(x))`) are skipped.
//
// Run by `yarn build-translations`, between extraction and key-type generation.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const EN = 'src/i18n/en.json';
const CHECK_ONLY = process.argv.includes('--check');

type Catalog = Record<string, string>;

const catalog = JSON.parse(fs.readFileSync(EN, 'utf8')) as Catalog;

const files: string[] = [];
(function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'mock-builders') continue;
      walk(full);
    } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(full);
    }
  }
})('src');

const isTCallee = (expr: ts.Expression): boolean =>
  (ts.isIdentifier(expr) && expr.text === 't') ||
  (ts.isPropertyAccessExpression(expr) && expr.name.text === 't');

/** `key -> copy` collected from the call sites, plus where each was seen. */
const wanted = new Map<string, { copy: string; file: string }>();
const conflicts: Array<{ key: string; a: string; b: string; file: string }> = [];

const want = (key: string, copy: string, file: string) => {
  const existing = wanted.get(key);
  if (existing && existing.copy !== copy) {
    conflicts.push({ a: existing.copy, b: copy, file, key });
    return;
  }
  wanted.set(key, { copy, file });
};

for (const file of files) {
  const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  (function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && isTCallee(node.expression)) {
      const [keyArg, second] = node.arguments;
      if (keyArg && ts.isStringLiteralLike(keyArg)) {
        const key = keyArg.text;
        if (second && ts.isStringLiteralLike(second)) {
          want(key, second.text, file);
        } else if (second && ts.isObjectLiteralExpression(second)) {
          for (const prop of second.properties) {
            if (!ts.isPropertyAssignment(prop)) continue;
            const name = prop.name.getText(sourceFile).replace(/['"]/g, '');
            const suffix = name.match(/^defaultValue_(\w+)$/)?.[1];
            if (suffix && ts.isStringLiteralLike(prop.initializer)) {
              want(`${key}_${suffix}`, prop.initializer.text, file);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  })(sourceFile);
}

const stale: Array<{ key: string; from: string; to: string; file: string }> = [];
for (const [key, { copy, file }] of wanted) {
  if (catalog[key] !== undefined && catalog[key] !== copy) {
    stale.push({ file, from: catalog[key], key, to: copy });
  }
}

if (conflicts.length) {
  console.error(`\n${conflicts.length} key(s) used with conflicting copy:`);
  for (const c of conflicts) {
    console.error(
      `  ${c.key}\n    ${JSON.stringify(c.a)}\n    ${JSON.stringify(c.b)}  (${c.file})`,
    );
  }
  console.error(
    '\nA key must render the same copy everywhere. Split it or align the two.',
  );
  process.exit(1);
}

if (!stale.length) {
  console.log(`en.json is in sync with ${wanted.size} inline defaults`);
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error(`\n${stale.length} en.json value(s) are stale vs the call site:`);
  for (const s of stale) {
    console.error(
      `  ${s.key}\n    en.json:   ${JSON.stringify(s.from)}\n    call site: ${JSON.stringify(s.to)}  (${s.file})`,
    );
  }
  console.error('\nRun `yarn build-translations` to sync.');
  process.exit(1);
}

for (const s of stale) {
  catalog[s.key] = s.to;
  console.log(`  ${s.key}: ${JSON.stringify(s.from)} -> ${JSON.stringify(s.to)}`);
}
const sorted: Catalog = {};
for (const key of Object.keys(catalog).sort()) sorted[key] = catalog[key];
fs.writeFileSync(EN, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`synced ${stale.length} value(s) from call sites into ${EN}`);
