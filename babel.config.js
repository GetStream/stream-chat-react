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
