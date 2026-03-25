import { defineConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr'],
  extract: {
    defaultNS: false,
    extractFromComments: false,
    functions: ['t', '*.t'],
    ignore: ['./src/**/__tests__/**', './src/mock-builders/**'],
    input: ['./src/**/*.{tsx,ts}'],
    keySeparator: false,
    nsSeparator: false,
    output: 'src/i18n/{{language}}.json',
    preservePatterns: [
      // to preserve a whole group
      'timestamp/*',

      // or  exact key if you want :
      // 'timestamp/DateSeparator',

      // or if you’re using explicit namespaces:
      // 'translation:timestamp/DateSeparator',
    ],
    removeUnusedKeys: false,
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});
