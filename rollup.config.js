import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import external from 'rollup-plugin-peer-deps-external';
import scss from 'rollup-plugin-scss';
import url from 'rollup-plugin-url';
import copy from 'rollup-plugin-copy-glob';
import globals from 'rollup-plugin-node-globals';
import visualizer from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';
import builtins from '@stream-io/rollup-plugin-node-builtins';

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
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
  }),
  commonjs(),
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
  plugins: [...basePlugins],
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
