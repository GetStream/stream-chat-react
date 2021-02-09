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
      plugins: [
        '@babel/plugin-proposal-class-properties',
        'transform-es2015-modules-commonjs',
        'babel-plugin-dynamic-import-node',
      ],
      presets: ['@babel/preset-env', '@babel/preset-react'],
    },
  },
  ignore: ['src/@types/*'],
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
  ],
  presets: ['@babel/preset-typescript', '@babel/env', '@babel/react'],
};
