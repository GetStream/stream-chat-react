// The content of babel.config.js copied here. This is due to the bug in jest - https://github.com/jestjs/jest/issues/11741
// The bug has been resolved with jest 30 - https://github.com/jestjs/jest/commit/983274ac08c67d2a445e111b2dfaf81020f912b2
module.exports = {
  env: {
    production: {
      presets: [
        [
          '@babel/env',
          {
            modules: false,
          },
        ],
      ],
    },
    test: {
      plugins: ['transform-es2015-modules-commonjs'],
      presets: [
        [
          '@babel/preset-env',
          {
            modules: 'commonjs',
          },
        ],
      ],
    },
  },
  ignore: ['src/@types/*'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
    'babel-plugin-dynamic-import-node',
  ],
  presets: ['@babel/preset-typescript', '@babel/env', '@babel/preset-react'],
};
