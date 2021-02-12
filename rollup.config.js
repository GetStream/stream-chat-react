import babel from '@rollup/plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import external from 'rollup-plugin-peer-deps-external';
import scss from 'rollup-plugin-scss';
import url from 'rollup-plugin-url';
import copy from 'rollup-plugin-copy-glob';
import globals from 'rollup-plugin-node-globals';
import visualizer from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';
import builtins from '@stream-io/rollup-plugin-node-builtins';
import { terser } from 'rollup-plugin-terser';
import { prepend } from 'rollup-plugin-insert';
import PropTypes from 'prop-types';
import process from 'process';
import pkg from './package.json';

process.env.NODE_ENV = 'production';

const styleBundle = ({ min } = { min: false }) => ({
  cache: false,
  input: 'src/styles/index.scss',
  output: [
    {
      dir: 'dist/css',
      format: 'es',
    },
  ],
  plugins: [
    scss({
      output: min ? pkg.style.replace('.css', '.min.css') : pkg.style,
      outputStyle: min ? 'compressed' : 'nested',
      prefix: `@import "./variables.scss";`,
    }),
  ],
  watch: {
    chokidar: false,
    include: 'src/styles/',
  },
});

const baseConfig = {
  cache: false,
  input: 'src/index.js',
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
  'lodash.isequal',
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
  'textarea-caret',
  /uuid/,
  'mml-react',
];

const basePlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  // Replace our alias for a relative path so the jsdoc resolution still
  // works after bundling.
  replace({
    delimiters: ['', ''],
    "import('types')": "import('../types')",
  }),
  // Remove peer-dependencies from final bundle
  external(),
  babel({
    babelHelpers: 'runtime',
    exclude: 'node_modules/**',
  }),
  commonjs({
    namedExports: {
      'node_modules/linkifyjs/index.js': ['find'],
      'node_modules/react-is/index.js': ['isValidElementType'],
      'prop-types': Object.keys(PropTypes),
    },
  }),
  // import files as data-uris or es modules
  url(),
  copy(
    [
      { dest: 'dist/scss', files: 'src/styles/**/*' },
      { dest: 'dist/assets', files: 'src/assets/*' },
      { dest: 'dist/i18n', files: 'src/i18n/*.json' },
    ],
    {
      verbose: process.env.VERBOSE,
      watch: process.env.ROLLUP_WATCH,
    },
  ),
  // Json to ES modules conversion
  json({ compact: true }),
  typescript(),
  process.env.BUNDLE_SIZE ? visualizer() : null,
];

const normalBundle = {
  ...baseConfig,
  external: externalDependencies,
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
  plugins: [...basePlugins],
};

const fullBrowserBundle = ({ min } = { min: false }) => ({
  ...baseConfig,
  output: [
    {
      extend: true, // extend window, not overwrite it
      file: min ? pkg.jsdelivr : pkg.jsdelivr.replace('.min', ''),
      format: 'iife',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'stream-chat': 'StreamChat',
      },
      name: 'window', // write all exported values to window
      sourcemap: true,
    },
  ],
  plugins: [
    ...basePlugins,
    {
      load: (id) => (id.match(/.s?css$/) ? '' : null),
      name: 'ignore-css-and-scss',
      resolveId: (importee) => (importee.match(/.s?css$/) ? importee : null),
    },
    builtins(),
    resolve({
      browser: true,
    }),
    globals({
      buffer: false,
      dirname: false,
      filename: false,
      globals: false,
      process: true,
    }),
    // To work with globals rollup expects them to be namespaced, what is not the case with stream-chat.
    // This injects some code to define stream-chat globals as expected by rollup.
    prepend(
      'window.StreamChat.StreamChat=StreamChat;window.StreamChat.logChatPromiseExecution=logChatPromiseExecution;window.StreamChat.Channel=Channel;window.ICAL=window.ICAL||{};',
    ),
    min ? terser() : null,
  ],
});

export default () =>
  process.env.ROLLUP_WATCH
    ? [styleBundle(), normalBundle]
    : [
        styleBundle(),
        styleBundle({ min: true }),
        normalBundle,
        fullBrowserBundle({ min: true }),
        fullBrowserBundle(),
      ];
