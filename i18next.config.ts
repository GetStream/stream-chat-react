import { defineConfig, I18nextToolkitConfig } from 'i18next-cli';

export default defineConfig({
  locales: ['de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr'],
  extract: {
    defaultNS: false,
    extractFromComments: false,
    functions: ['t', '*.t'],
    input: ['./src/**/*.{tsx,ts}'],
    keySeparator: false,
    nsSeparator: false,
    output: 'src/i18n/{{language}}.json',
    // sort(a, b) {
    //   return a <= b ? -1 : 1; // alphabetical order
    // },
  },
  types: {
    input: ['locales/{{language}}/{{namespace}}.json'],
    output: 'src/types/i18next.d.ts',
  },
});
