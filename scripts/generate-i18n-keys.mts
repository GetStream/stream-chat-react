// Regenerates src/i18n/keys.ts — the type-only catalog of every translation key mapped to its English
// copy. The i18n types derive `TranslationKey` / `StreamTFunction` from it, so a typo'd key is a compile
// error rather than a string that silently stops rendering.
//
// The generator itself lives in `stream-chat/i18n/codegen`, shared with the React Native SDK. Only this
// package's paths and prefixes are configured here; the call-site reader, the four hard-fail guards and
// the emitter are all core's.
//
// Run by `yarn build-translations`, from the package root — every path below is relative to it.
// `yarn validate-translations` runs it and fails on any diff, which is the drift gate.
import ts from 'typescript';
import { generateI18nKeys } from 'stream-chat/i18n/codegen';

const jsonFlag = process.argv.indexOf('--json');
const jsonOut = jsonFlag === -1 ? undefined : process.argv[jsonFlag + 1];

if (jsonFlag !== -1 && (!jsonOut || jsonOut.startsWith('--'))) {
  console.error('--json requires an output path');
  process.exit(1);
}

try {
  generateI18nKeys({
    fixtureOut: 'src/i18n/__tests__/catalog.fixture.json',
    // `language.*` names come from `stream-chat/i18n` rather than from this package's
    // runtimeDefaults, so they are excluded from the translator export alongside the formatter
    // expressions — a TMS should not be asked to translate the SDK's own language list.
    extraFormatterPrefixes: ['translationBuilderTopic.', 'language.'],
    json: jsonOut
      ? { includeFormats: process.argv.includes('--all'), out: jsonOut }
      : undefined,
    keysOut: 'src/i18n/keys.ts',
    migrationGuideRef: 'ai-docs/i18n-v15-migration.md#date-and-time',
    runtimeDefaultsPath: 'src/i18n/runtimeDefaults.ts',
    ts,
  });
} catch (error) {
  // The generator throws with every guard failure formatted; exit non-zero so CI fails.
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
