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
import PropTypes from 'prop-types';

import replace from 'rollup-plugin-replace';

import pkg from './package.json';

import process from 'process';
process.env.NODE_ENV = 'production';

const baseConfig = {
  input: 'src/index.js',
  cache: false,
  watch: {
    chokidar: false,
  },
};

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
  external: [
    'anchorme',
    'moment',
    'stream-chat-client',
    'react-images',
    'lodash/debounce',
    'lodash/throttle',
    'lodash/truncate',
    'lodash/uniq',
    'lodash.uniqby',
    'emoji-mart',
    'emoji-mart/data/all.json',
    'emoji-regex',
    'seamless-immutable',
    'isomorphic-ws',
    'visibilityjs',
    'custom-event',
    'textarea-caret',
    '@braintree/sanitize-url',
    '@webscopeio/react-textarea-autocomplete',
    '@webscopeio/react-textarea-autocomplete/style.css',
    'emoji-mart/css/emoji-mart.css',
    'react-dropzone',
    'react-markdown',
    'deep-equal',
    'shallow-diff',
    'immutable',
    'url-parse',
    'stream-chat',
    'pretty-bytes',
    'stream-analytics',
    'react-textarea-autosize',
    'prop-types',
    'react-player',
    'react-markdown/with-html',
    'react-file-utils',
    'react-file-utils/dist/index.css',
    'uuid/v4',
    '@fortawesome/react-fontawesome',
    '@fortawesome/free-regular-svg-icons',
    '@babel/runtime/regenerator',
    '@babel/runtime/helpers/asyncToGenerator',
    '@babel/runtime/helpers/objectWithoutProperties',
    '@babel/runtime/helpers/toConsumableArray',
    '@babel/runtime/helpers/objectSpread',
    '@babel/runtime/helpers/extends',
    '@babel/runtime/helpers/defineProperty',
    '@babel/runtime/helpers/assertThisInitialized',
    '@babel/runtime/helpers/inherits',
    '@babel/runtime/helpers/getPrototypeOf',
    '@babel/runtime/helpers/possibleConstructorReturn',
    '@babel/runtime/helpers/createClass',
    '@babel/runtime/helpers/classCallCheck',
    '@babel/runtime/helpers/slicedToArray',
    '@babel/runtime/helpers/typeof',
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    external(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    scss({
      output: pkg.style,
    }),
    copy([{ files: 'src/assets/*', dest: 'dist/assets' }], {
      verbose: true,
      watch: process.env.ROLLUP_WATCH,
    }),
    url(),
    commonjs(),
    json(),
  ],
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
      browser: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    external(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    {
      name: 'ignore-css-and-scss',
      resolveId: (importee) => (importee.match(/.s?css$/) ? importee : null),
      load: (id) => (id.match(/.s?css$/) ? '' : null),
    },
    builtins(),
    resolve({
      browser: true,
    }),
    url(),
    commonjs({
      namedExports: {
        'prop-types': Object.keys(PropTypes),
      },
    }),
    json(),
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
  process.env.ROLLUP_WATCH ? [normalBundle] : [normalBundle, fullBrowserBundle];
