// Makes the inline English copy at each `t()` call site authoritative for `src/i18n/en.json`.
//
// Why this exists: `i18next-cli extract` only *adds* keys — it deliberately never overwrites an
// existing value, which is right for translated locales but wrong for the source language. Without
// this step, en.json would drift from the copy the components actually render, and the drift gate
// would stay green. en.json is the translator-facing reference and the source for keys.ts, so it
// has to match the call sites exactly.
//
// Handles the three call shapes the SDK uses:
//   t('key', 'Copy')                              -> en['key'] = 'Copy'
//   t('key', { defaultValue_one, defaultValue_other, count })  -> en['key_one'], en['key_other']
//   t('key', { … })  with no default              -> left alone (formatter/plumbing keys)
// Keys built from a runtime value (`t(asDynamicKey(x))`) are skipped.
//
// Run by `yarn build-translations`, between extraction and key-type generation.
import fs from 'node:fs';
import { readCallSiteCopy } from './i18n-call-sites.mts';

const EN = 'src/i18n/en.json';
const CHECK_ONLY = process.argv.includes('--check');

type Catalog = Record<string, string>;

const catalog = JSON.parse(fs.readFileSync(EN, 'utf8')) as Catalog;
const { conflicts, copy: wanted } = readCallSiteCopy();

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

const stale: Array<{ key: string; from: string; to: string }> = [];
for (const [key, copy] of wanted) {
  if (catalog[key] !== undefined && catalog[key] !== copy) {
    stale.push({ from: catalog[key], key, to: copy });
  }
}

if (!stale.length) {
  console.log(`en.json is in sync with ${wanted.size} inline defaults`);
  process.exit(0);
}

if (CHECK_ONLY) {
  console.error(`\n${stale.length} en.json value(s) are stale vs the call site:`);
  for (const s of stale) {
    console.error(
      `  ${s.key}\n    en.json:   ${JSON.stringify(s.from)}\n    call site: ${JSON.stringify(s.to)}`,
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
