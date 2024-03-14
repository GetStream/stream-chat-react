#!/usr/bin/env node

import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import * as esbuild from 'esbuild';

const sdkEntrypoint = resolve(import.meta.dirname, '../src/index.ts');
const emojiEntrypoint = resolve(import.meta.dirname, '../src/components/Emojis/index.ts');
const browserBundleEntrypoint = resolve(import.meta.dirname, '../src/index_UMD.ts');
const outDir = resolve(import.meta.dirname, '../dist');

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
