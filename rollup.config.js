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

import replace from '@rollup/plugin-replace';

import process from 'process';
import pkg from './package.json';

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
    'linkifyjs',
    'linkifyjs/lib/linkify',
    'dayjs',
    'dayjs/plugin/calendar',
    'dayjs/plugin/updateLocale',
    'dayjs/plugin/localizedFormat',
    'dayjs/plugin/localeData',
    'dayjs/plugin/relativeTime',
    'stream-chat-client',
    'react-images',
    'lodash.debounce',
    'lodash.throttle',
    'lodash/truncate',
    'i18next',
    'moment',
    'dayjs/locale/nl',
    'dayjs/locale/it',
    'dayjs/locale/ru',
    'dayjs/locale/tr',
    'dayjs/locale/fr',
    'dayjs/locale/hi',
    'dayjs/locale/es',
    'dayjs/locale/en',
    'lodash/uniq',
    'lodash.uniqby',
    'lodash.truncate',
    'emoji-mart',
    'emoji-mart/data/all.json',
    'emoji-regex',
    'seamless-immutable',
    'isomorphic-ws',
    'custom-event',
    'textarea-caret',
    '@braintree/sanitize-url',
    'emoji-mart/css/emoji-mart.css',
    'react-dropzone',
    'react-markdown',
    'react-fast-compare',
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
    'uuid',
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
    'react-is',
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    replace({
      "import('types')": "import('../types')",
      delimiters: ['', ''],
    }),
    external(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
    }),
    scss({
      output: pkg.style,
      prefix: `@import "./variables.scss";`,
    }),
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
    replace({
      "import('types')": "import('../types')",
      delimiters: ['', ''],
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
        'node_modules/react-is/index.js': ['isValidElementType'],
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
    copy([{ files: 'src/i18n/*.json', dest: 'dist/i18n' }]),
    // terser(),
  ],
};

export default () =>
  process.env.ROLLUP_WATCH ? [normalBundle] : [normalBundle, fullBrowserBundle];
