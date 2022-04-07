// https://github.com/i18next/i18next-parser#options
module.exports = {
  createOldCatalogs: false,
  input: ['./src/**/*.{tsx,ts}'],
  keySeparator: false,
  locales: ['de', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'ru', 'tr'],
  namespaceSeparator: false,
  output: 'src/i18n/$LOCALE.json',
  sort(a, b) {
    return a < b ? -1 : 1; // alfabetical order
  },
  useKeysAsDefaultValue: true,
  verbose: true,
};
