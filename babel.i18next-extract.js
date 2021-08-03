module.exports = function (api) {
  api.cache(true);
  return {
    ignore: ['./**/*.d.ts'],
    presets: ['@babel/preset-typescript', '@babel/env', '@babel/react'],
    plugins: [
      [
        'i18next-extract',
        {
          contextSeparator: '__',
          defaultContexts: [''],
          defaultNS: 'en',
          locales: ['nl', 'en', 'it', 'tr', 'fr', 'hi', 'ru', 'es', 'pt', 'de', 'ja', 'ko'],
          jsonSpace: 4,
          keySeparator: null,
          nsSeparator: null,
          keyAsDefaultValue: ['en'],
          keyAsDefaultValueForDerivedKeys: false,
          outputPath: 'src/i18n/{{locale}}.json',
          discardOldKeys: true,
        },
      ],
      '@babel/proposal-class-properties',
      '@babel/transform-runtime',
    ],
  };
};
