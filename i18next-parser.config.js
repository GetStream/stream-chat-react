/* eslint-disable no-undef */
// https://github.com/i18next/i18next-parser#options
module.exports = {
  createOldCatalogs: false,
  input: ['./src/**/*.{tsx,ts}'],
  keepRemoved: true,
  keySeparator: false,
  locales: ['de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr'],
  namespaceSeparator: false,
  output: 'src/i18n/$LOCALE.json',
  sort(a, b) {
    return a < b ? -1 : 1; // alphabetical order
  },
  verbose: true,
};
