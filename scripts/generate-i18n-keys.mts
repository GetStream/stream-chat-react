// Generates src/i18n/keys.ts — the type-only catalog of every translation key mapped to its
// English copy. `src/i18n/types.ts` derives `TranslationKey` / `StreamTFunction` from it, so a
// typo'd key is a compile error.
//
// It is type-only on purpose: no runtime value is emitted, so it costs nothing in the bundle.
// (Deriving the type from `typeof import('./en.json')` would not work for consumers either — tsc
// does not copy JSON into dist/types.)
//
// The catalog has exactly two sources, and both are the place the copy is actually used:
//
//   1. Inline defaults at the call sites — `t('message.status.sent.text', 'Sent')`. 562 keys.
//      i18next renders these from the `defaultValue`, so they are never bundled as data.
//   2. src/i18n/runtimeDefaults.ts — hand-maintained, and the only translation data that ships.
//      Just the keys with no inline copy to fall back on: `language.*` (built from a runtime
//      code), `timestamp.*` / `duration.*` (formatter expressions passed around as prop values),
//      and the postProcessor directive. 71 keys.
//
// There is deliberately no checked-in en.json. It was a third copy of strings that already exist
// in those two places, and keeping it in sync needed an extract pass plus a sync pass. Pass
// `--json <path>` to write the full catalog out as JSON on demand, for a translator or a TMS.
//
// Run by `yarn build-translations`.
import fs from 'node:fs';
import ts from 'typescript';
import { readCallSiteCopy } from './i18n-call-sites.mts';

const RUNTIME_DEFAULTS = 'src/i18n/runtimeDefaults.ts';
const KEYS_OUT = 'src/i18n/keys.ts';

const jsonFlag = process.argv.indexOf('--json');
const JSON_OUT = jsonFlag === -1 ? null : process.argv[jsonFlag + 1];
if (jsonFlag !== -1 && !JSON_OUT) {
  console.error('--json requires an output path');
  process.exit(1);
}

const fail = (message: string, lines: string[]) => {
  console.error(`\n${message}`);
  for (const line of lines) console.error(`  ${line}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------------------
// Read the hand-maintained runtime resource
// ---------------------------------------------------------------------------------------
// Parsed rather than imported: `await import()` works under Node's type stripping but warns
// MODULE_TYPELESS_PACKAGE_JSON on every run, and the package cannot be `"type": "module"`.
const readRuntimeDefaults = (): Map<string, string> => {
  const source = ts.createSourceFile(
    RUNTIME_DEFAULTS,
    fs.readFileSync(RUNTIME_DEFAULTS, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const out = new Map<string, string>();
  let found = false;

  ts.forEachChild(source, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== 'runtimeDefaults' ||
        !declaration.initializer
      ) {
        continue;
      }
      // `export const runtimeDefaults = { … } as const` / `satisfies …` are both fine.
      let initializer: ts.Expression = declaration.initializer;
      while (ts.isAsExpression(initializer) || ts.isSatisfiesExpression(initializer)) {
        initializer = initializer.expression;
      }
      if (!ts.isObjectLiteralExpression(initializer)) continue;
      found = true;
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) {
          fail(`${RUNTIME_DEFAULTS} must be a flat object of string literals.`, [
            property.getText(source).slice(0, 80),
          ]);
        }
        const assignment = property as ts.PropertyAssignment;
        if (
          !ts.isStringLiteralLike(assignment.name) ||
          !ts.isStringLiteralLike(assignment.initializer)
        ) {
          fail(`${RUNTIME_DEFAULTS} entries must be 'quoted.key': 'string literal'.`, [
            assignment.getText(source).slice(0, 80),
          ]);
        }
        out.set(
          (assignment.name as ts.StringLiteralLike).text,
          (assignment.initializer as ts.StringLiteralLike).text,
        );
      }
    }
  });

  if (!found) {
    fail(`could not find an exported \`runtimeDefaults\` object literal in`, [
      RUNTIME_DEFAULTS,
    ]);
  }
  return out;
};

const runtimeDefaults = readRuntimeDefaults();
const { conflicts, copy: inlineCopy, withoutCopy } = readCallSiteCopy();

// ---------------------------------------------------------------------------------------
// Cross-check the two sources
// ---------------------------------------------------------------------------------------
if (conflicts.length) {
  fail(
    `${conflicts.length} key(s) used with conflicting inline copy — a key must render one thing:`,
    conflicts.map(
      (c) =>
        `${c.key}\n    ${JSON.stringify(c.a)}\n    ${JSON.stringify(c.b)}  (${c.file})`,
    ),
  );
}

// A key called without inline copy resolves from the bundled resource or not at all — i18next
// would render the raw dotted key in the UI.
const unresolvable = [...withoutCopy].filter(([key]) => !runtimeDefaults.has(key));
if (unresolvable.length) {
  fail(
    `${unresolvable.length} key(s) are called with no inline default and are missing from ${RUNTIME_DEFAULTS}.\n` +
      `They would render as the raw key. Either pass the English copy inline — t('key', 'Copy') —\n` +
      `or add an entry to ${RUNTIME_DEFAULTS}:`,
    unresolvable.map(([key, file]) => `${key}  (${file})`),
  );
}

// The bundled resource wins over a `defaultValue`, so a key in both places silently renders the
// bundled string and ignores the copy at the call site.
const shadowed = [...runtimeDefaults.keys()].filter((key) => inlineCopy.has(key));
if (shadowed.length) {
  fail(
    `${shadowed.length} key(s) are in both ${RUNTIME_DEFAULTS} and an inline default.\n` +
      `The bundled value wins, so editing the call site would silently change nothing.\n` +
      `Remove the runtimeDefaults entry:`,
    shadowed.map(
      (key) =>
        `${key}\n    bundled:   ${JSON.stringify(runtimeDefaults.get(key))}\n    call site: ${JSON.stringify(inlineCopy.get(key))}`,
    ),
  );
}

// ---------------------------------------------------------------------------------------
// keys.ts
// ---------------------------------------------------------------------------------------
const catalog = new Map([...inlineCopy, ...runtimeDefaults]);
const keys = [...catalog.keys()].sort();

const lines: string[] = [
  '// AUTO-GENERATED by scripts/generate-i18n-keys.mts — do not edit by hand.',
  '// Regenerate with `yarn build-translations`. CI fails if this file is out of sync.',
  '//',
  '// Type-only: no runtime value is emitted, so this adds nothing to the bundle.',
  '',
  '/**',
  ' * Every translation entry shipped with the SDK, mapped to its English copy.',
  ' *',
  ' * Plural entries appear as `<key>_one` / `<key>_other`; call sites use the bare `<key>` and',
  ' * pass `count`. See {@link TranslationKey}.',
  ' */',
  'export type TranslationCatalog = {',
];
for (const key of keys) {
  lines.push(`  ${JSON.stringify(key)}: ${JSON.stringify(catalog.get(key))};`);
}
lines.push('};', '');
fs.writeFileSync(KEYS_OUT, lines.join('\n'));

console.log(
  `generated ${KEYS_OUT} (${keys.length} entries, type-only) — ` +
    `${inlineCopy.size} from inline defaults, ${runtimeDefaults.size} bundled`,
);

// ---------------------------------------------------------------------------------------
// Optional JSON export, for translators / a TMS
// ---------------------------------------------------------------------------------------
if (JSON_OUT) {
  const asObject: Record<string, string> = {};
  for (const key of keys) asObject[key] = catalog.get(key)!;
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(asObject, null, 2)}\n`);
  console.log(`wrote ${JSON_OUT} (${keys.length} entries)`);
}
