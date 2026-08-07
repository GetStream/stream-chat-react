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
      // Integrator-overridable timestamp format strings; never referenced as a literal.
      'timestamp/*',
      // ISO language names, resolved via `t(languageKey)` in MessageTranslationIndicator.
      'language/*',
    ],
    removeUnusedKeys: true,
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});
