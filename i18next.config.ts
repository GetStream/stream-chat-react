import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['en'],
  extract: {
    defaultNS: false,
    extractFromComments: false,
    functions: ['t', '*.t'],
    ignore: ['./src/**/__tests__/**', './src/mock-builders/**'],
    input: ['./src/**/*.{tsx,ts}'],
    keySeparator: false,
    nsSeparator: false,
    output: 'src/i18n/{{language}}.json',
    // `removeUnusedKeys` prunes anything the extractor cannot see in a `t()` call, so every
    // key resolved from a runtime value must be preserved explicitly here or it gets deleted.
    preservePatterns: [
      // Values are formatter expressions ("{{ timestamp | timestampFormatter(...) }}"), not
      // English copy, so call sites deliberately pass no inline default. Without preserving
      // them, extraction would overwrite each value with its own key name.
      'timestamp.*',
      'duration.*',
      'translationBuilderTopic.*',
      // ISO language names, resolved via `t('language.' + code)` in MessageTranslationIndicator.
      'language.*',
    ],
    removeUnusedKeys: true,
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});
