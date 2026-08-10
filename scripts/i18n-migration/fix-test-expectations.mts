// Some tests assert on the *old* translation key because the identity `t` mock made the key and
// the rendered text identical (`'aria/Send'` rendered as "aria/Send"). Now that keys are opaque
// and the inline default renders, those assertions must use the English copy instead.
//
// Only literals that are an old key AND differ from their English value are touched, so
// assertions like `'Cancel'` (where key === value) are left alone.
//
// CAUTION: this matches any string literal equal to an old key, including identifiers that only
// coincidentally share a key's name (`'replyCount'` is a label part name as well as an old key).
// Review the diff — the report below lists every replacement.
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import type { EnglishCatalog, Edit, KeyMap } from './types.mts';

type Replacement = Edit & { from: string; to: string };

const originalEnPath = process.argv[2];
if (!originalEnPath) {
  console.error(
    'usage: fix-test-expectations.mts <pre-migration-en.json> [--dry]\n' +
      '  get the pre-migration catalog with: git show <commit>:src/i18n/en.json',
  );
  process.exit(1);
}

const DRY = process.argv.includes('--dry');
const mapping = (
  JSON.parse(fs.readFileSync('ai-docs/i18n-v15-key-map.json', 'utf8')) as KeyMap
).keys;
const originalEn = JSON.parse(fs.readFileSync(originalEnPath, 'utf8')) as EnglishCatalog;

const englishFor = (oldKey: string): string | undefined => {
  if (originalEn[oldKey] !== undefined) return originalEn[oldKey];
  // Plural bases have no bare entry; the `_other` form is the better fit for an assertion.
  if (originalEn[`${oldKey}_other`] !== undefined) return originalEn[`${oldKey}_other`];
  if (oldKey.startsWith('aria/')) return oldKey.slice('aria/'.length);
  return undefined;
};

const files: string[] = [];
(function walk(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.test\.tsx?$/.test(entry.name)) files.push(full);
  }
})('src');

let total = 0;
const changedFiles: string[] = [];
const samples: Array<[file: string, from: string, to: string]> = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const edits: Replacement[] = [];
  (function visit(node: ts.Node) {
    if (ts.isStringLiteralLike(node)) {
      const oldKey = node.text;
      const entry = mapping[oldKey];
      if (entry) {
        // Formatter/plumbing keys are passed *as keys* in tests (timestampTranslationKey props,
        // postProcessor names), so they get the new key. Prose keys were standing in for the
        // rendered text, so they get the English copy.
        const replacement = entry.prose ? englishFor(oldKey) : entry.key;
        if (replacement !== undefined && replacement !== oldKey) {
          edits.push({
            end: node.getEnd(),
            from: oldKey,
            start: node.getStart(sourceFile),
            text: JSON.stringify(replacement),
            to: replacement,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  })(sourceFile);

  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = text;
  for (const edit of edits) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }
  total += edits.length;
  changedFiles.push(file);
  if (samples.length < 12) {
    samples.push(
      ...edits.slice(0, 2).map((e): [string, string, string] => [file, e.from, e.to]),
    );
  }
  if (!DRY) fs.writeFileSync(file, out);
}

console.log(DRY ? '(dry run)' : '(applied)');
console.log('replacements:', total, 'in', changedFiles.length, 'files');
for (const [file, from, to] of samples) {
  console.log(
    `  ${path.basename(file)}: ${JSON.stringify(from)} -> ${JSON.stringify(to)}`,
  );
}
