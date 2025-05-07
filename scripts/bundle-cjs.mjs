#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';
import getPackageVersion from './get-package-version.mjs';
import packageJson from '../package.json' with { type: 'json' };

// import.meta.dirname is not available before Node 20
const __dirname = dirname(fileURLToPath(import.meta.url));

const sdkEntrypoint = resolve(__dirname, '../src/index.ts');
const emojiEntrypoint = resolve(__dirname, '../src/plugins/Emojis/index.ts');
const mp3EncoderEntrypoint = resolve(__dirname, '../src/plugins/encoders/mp3.ts');
const experimentalEntrypoint = resolve(__dirname, '../src/experimental/index.ts');
const outDir = resolve(__dirname, '../dist');

// Those dependencies are distributed as ES modules, and cannot be externalized
// in our CJS bundle. We convert them to CJS and bundle them instead.
const bundledDeps = [
  'hast-util-find-and-replace',
  'unist-builder',
  'unist-util-visit',
  'react-markdown',
  'remark-gfm',
];

const deps = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
});
const external = deps.filter((dep) => !bundledDeps.includes(dep));

/** @type esbuild.BuildOptions */
const cjsBundleConfig = {
  entryPoints: [
    sdkEntrypoint,
    emojiEntrypoint,
    mp3EncoderEntrypoint,
    experimentalEntrypoint,
  ],
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  external,
  outdir: outDir,
  outExtension: { '.js': '.cjs' },
  sourcemap: 'linked',
};

// We build two CJS bundles: for browser and for node. The latter one can be
// used e.g. during SSR (although it makes little sence to SSR chat, but still
// nice for import not to break on server).
const bundles = ['browser', 'node'].map((platform) =>
  esbuild.build({
    ...cjsBundleConfig,
    entryNames: `[dir]/[name].${platform}`,
    platform,
    plugins: [
      replace({
        __STREAM_CHAT_REACT_VERSION__: getPackageVersion(),
      }),
    ],
  }),
);
await Promise.all(bundles);
