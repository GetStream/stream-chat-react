// Some tests assert on the *old* translation key because the identity `t` mock made the key and
// the rendered text identical (`'aria/Send'` rendered as "aria/Send"). Now that keys are opaque
// and the inline default renders, those assertions must use the English copy instead.
//
// Only literals that are an old key AND differ from their English value are touched, so
// assertions like `'Cancel'` (where key === value) are left alone.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const mapping = JSON.parse(
  fs.readFileSync('scripts/i18n-migration/key-map.json', 'utf8'),
).keys;
// English copy, taken from the pre-migration en.json (keyed by the old natural-language keys).
const originalEn = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

const englishFor = (oldKey) => {
  if (originalEn[oldKey] !== undefined) return originalEn[oldKey];
  // plural bases have no bare entry; prefer the `_other` form for assertions
  if (originalEn[`${oldKey}_other`] !== undefined) return originalEn[`${oldKey}_other`];
  if (oldKey.startsWith('aria/')) return oldKey.slice('aria/'.length);
  return undefined;
};

const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.test\.tsx?$/.test(e.name)) files.push(p);
  }
})('src');

let total = 0;
const changedFiles = [];
const samples = [];

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
  (function visit(node) {
    if (ts.isStringLiteralLike(node)) {
      const oldKey = node.text;
      const entry = mapping[oldKey];
      if (entry) {
        // Formatter/plumbing keys are passed *as keys* in tests (timestampTranslationKey
        // props, postProcessor names), so they get the new key. Prose keys were being used as
        // stand-ins for the rendered text, so they get the English copy.
        const replacement = entry.prose ? englishFor(oldKey) : entry.key;
        if (replacement !== undefined && replacement !== oldKey) {
          edits.push({
            start: node.getStart(sf),
            end: node.getEnd(),
            text: JSON.stringify(replacement),
            from: oldKey,
            to: replacement,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  })(sf);

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  total += edits.length;
  changedFiles.push(file);
  if (samples.length < 12)
    samples.push(...edits.slice(0, 2).map((e) => [file, e.from, e.to]));
  if (!DRY) fs.writeFileSync(file, out);
}

console.log(DRY ? '(dry run)' : '(applied)');
console.log('replacements:', total, 'in', changedFiles.length, 'files');
for (const [f, from, to] of samples) {
  console.log(`  ${path.basename(f)}: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`);
}
