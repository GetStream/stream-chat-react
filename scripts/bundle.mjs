#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

// import.meta.dirname is not available before Node 20
const __dirname = dirname(fileURLToPath(import.meta.url));

const sdkEntrypoint = resolve(__dirname, '../src/index.ts');
const emojiEntrypoint = resolve(__dirname, '../src/components/Emojis/index.ts');
const browserBundleEntrypoint = resolve(__dirname, '../src/index_UMD.ts');
const outDir = resolve(__dirname, '../dist');

const cjsBundleConfig = {
  entryPoints: [sdkEntrypoint, emojiEntrypoint],
  bundle: true,
  format: 'cjs',
  packages: 'external',
  outdir: outDir,
  entryNames: '[dir]/[name].cjs',
  sourcemap: 'linked',
};

const browserBundleConfig = {
  entryPoints: [browserBundleEntrypoint],
  bundle: true,
  format: 'iife',
  external: ['react', 'react-dom', 'stream-chat'],
  outfile: resolve(outDir, 'browser.full-bundle.js'),
  sourcemap: 'linked',
};

const browserBundleMinConfig = {
  ...browserBundleConfig,
  minify: true,
  outfile: resolve(outDir, 'browser.full-bundle.min.js'),
};

await Promise.all([
  esbuild.build(cjsBundleConfig),
  esbuild.build(browserBundleConfig),
  esbuild.build(browserBundleMinConfig),
]);
