// @flow
import babel from 'rollup-plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import scss from 'rollup-plugin-scss';
import json from '@rollup/plugin-json';
import url from '@rollup/plugin-url';
import copy from 'rollup-plugin-copy-glob';
import resolve from '@rollup/plugin-node-resolve';
import builtins from '@stream-io/rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

import typescript from '@rollup/plugin-typescript';

// import nodePolyfills from 'rollup-plugin-node-polyfills';
import process from 'process';

// eslint-disable-next-line
// import { terser } from 'rollup-plugin-terser';
import PropTypes from 'prop-types';

import replace from 'rollup-plugin-replace';

import pkg from './package.json';

process.env.NODE_ENV = 'production';

const baseConfig = {
  input: 'src/index.ts',
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
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    typescript({ noEmitOnError: true }),
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
      prefix: `@import "./variables.scss";`,
    }),
    copy(
      [
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
      browser: true,
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
      },
    },
  ],
  // external: ['process', 'buffer'],
  plugins: [
    typescript({ noEmitOnError: true }),
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
    builtins(), // removed to fix build not sure if neccesary
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
      globals: false,
      dirname: false,
      filename: false,
      process: true,
      buffer: true,
    }),
    // nodePolyfills({
    //   process: true,
    //   buffer: true,
    // }),
    copy([{ files: 'src/i18n/*.json', dest: 'dist/i18n' }]),
    // terser(),
  ],
};

export default () =>
  process.env.ROLLUP_WATCH ? [normalBundle] : [normalBundle, fullBrowserBundle];
