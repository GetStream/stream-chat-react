import babel from '@rollup/plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import external from 'rollup-plugin-peer-deps-external';
import url from 'rollup-plugin-url';
import copy from 'rollup-plugin-copy';
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

const baseConfig = {
  cache: false,
  inlineDynamicImports: true,
  input: 'src/index.ts',
  watch: {
    chokidar: false,
  },
};

const dependencies = Object.keys(pkg.dependencies);
const optionalDependencies = Object.keys(pkg.optionalDependencies);

const externalDependencies = [
  /@babel/,
  /react-markdown/,
  /dayjs/,
  ...dependencies,
  ...optionalDependencies,
];

const basePlugins = [
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': JSON.stringify('production'),
  }),
  // Remove peer-dependencies from final bundle
  external(),
  typescript(),
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
  copy({
    targets: [
      { dest: 'dist/assets', src: './node_modules/@stream-io/stream-chat-css/dist/assets/*' },
      { dest: 'dist/css', src: './node_modules/@stream-io/stream-chat-css/dist/css/index.css' },
      { dest: 'dist/scss', src: './node_modules/@stream-io/stream-chat-css/dist/scss/*' },
    ],
    verbose: process.env.VERBOSE,
    watch: process.env.ROLLUP_WATCH,
  }),
  // Json to ES modules conversion
  json({ compact: true }),
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
  ],
  plugins: [...basePlugins],
};

const fullBrowserBundle = ({ min } = { min: false }) => ({
  ...baseConfig,
  output: [
    {
      file: min ? pkg.jsdelivr : pkg.jsdelivr.replace('.min', ''),
      format: 'iife',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        'stream-chat': 'StreamChat',
      },
      name: 'StreamChatReact', // write all exported values to window under key StreamChatReact
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
    // To work with globals rollup expects them to be namespaced, which is not the case with stream-chat.
    // This injects some code to define stream-chat globals as expected by rollup.
    prepend(
      'window.StreamChat.StreamChat=StreamChat;window.StreamChat.logChatPromiseExecution=logChatPromiseExecution;window.StreamChat.Channel=Channel;window.ICAL=window.ICAL||{};',
    ),
    min ? terser() : null,
  ],
});

export default () =>
  process.env.ROLLUP_WATCH
    ? [normalBundle]
    : [normalBundle, fullBrowserBundle({ min: true }), fullBrowserBundle()];
