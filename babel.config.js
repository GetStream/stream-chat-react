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
      presets: [
        '@babel/preset-react',
        '@babel/preset-typescript',
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
  ],
  presets: ['@babel/preset-typescript', '@babel/env', '@babel/preset-react'],
};
