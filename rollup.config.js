// @flow
import babel from 'rollup-plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from 'rollup-plugin-commonjs';
import scss from 'rollup-plugin-scss';
import json from 'rollup-plugin-json';
import url from 'rollup-plugin-url';
import copy from 'rollup-plugin-copy-glob';
import resolve from 'rollup-plugin-node-resolve';
import builtins from '@stream-io/rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import visualizer from 'rollup-plugin-visualizer';
import PropTypes from 'prop-types';
import replace from '@rollup/plugin-replace';

import process from 'process';
import pkg from './package.json';

process.env.NODE_ENV = 'production';

const styleBundle = {
  input: 'src/styles/index.scss',
  cache: false,
  watch: {
    chokidar: false,
  },
  plugins: [
    scss({
      output: pkg.style,
      prefix: `@import "./variables.scss";`,
    }),
  ],
};

const baseConfig = {
  input: 'src/index.js',
  cache: false,
  watch: {
    chokidar: false,
  },
};

const externalDependencies = [
  /@babel/,
  '@braintree/sanitize-url',
  '@fortawesome/free-regular-svg-icons',
  '@fortawesome/react-fontawesome',
  'custom-event',
  /dayjs/,
  /emoji-mart/,
  'emoji-regex',
  'i18next',
  'isomorphic-ws',
  'linkifyjs',
  'lodash.debounce',
  'lodash.throttle',
  'lodash.uniqby',
  'pretty-bytes',
  'prop-types',
  'react-fast-compare',
  /react-file-utils/,
  'react-images',
  'react-is',
  /react-markdown/,
  'react-player',
  'react-textarea-autosize',
  'react-virtuoso',
  'seamless-immutable',
  'textarea-caret',
  /uuid/,
];

const basePlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  // Replace our alias for a relative path so the jsdoc resolution still
  // works after bundling.
  replace({
    "import('types')": "import('../types')",
    delimiters: ['', ''],
  }),
  // Remove peer-dependencies from final bundle
  external(),
  babel({
    runtimeHelpers: true,
    exclude: 'node_modules/**',
  }),
  // import files as data-uris or es modules
  url(),
  copy(
    [
      { files: 'src/styles/**/*', dest: 'dist/scss' },
      { files: 'src/assets/*', dest: 'dist/assets' },
      { files: 'src/i18n/*.json', dest: 'dist/i18n' },
    ],
    {
      verbose: true,
      watch: process.env.ROLLUP_WATCH,
    },
  ),
  // Json to ES modules conversion
  json(),
  process.env.BUNDLE_SIZE ? visualizer() : null,
];

const normalBundle = {
  ...baseConfig,
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  external: externalDependencies,
  plugins: [...basePlugins, commonjs()],
};

const fullBrowserBundle = {
  ...baseConfig,
  output: [
    {
      file: pkg.jsdelivr,
      format: 'iife',
      sourcemap: true,
      name: 'window', // write all exported values to window
      extend: true, // extend window, not overwrite it
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'stream-chat': 'StreamChat',
      },
    },
  ],
  plugins: [
    ...basePlugins,
    {
      name: 'ignore-css-and-scss',
      resolveId: (importee) => (importee.match(/.s?css$/) ? importee : null),
      load: (id) => (id.match(/.s?css$/) ? '' : null),
    },
    builtins(),
    resolve({
      browser: true,
    }),
    commonjs({
      namedExports: {
        'prop-types': Object.keys(PropTypes),
        'node_modules/react-is/index.js': ['isValidElementType'],
        'node_modules/linkifyjs/index.js': ['find'],
      },
    }),
    globals({
      process: true,
      globals: false,
      buffer: false,
      dirname: false,
      filename: false,
    }),
    // terser(),
  ],
};

export default () =>
  process.env.ROLLUP_WATCH
    ? [styleBundle, normalBundle]
    : [styleBundle, normalBundle, fullBrowserBundle];
