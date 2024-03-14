#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals';

// import.meta.dirname is not available before Node 20
const __dirname = dirname(fileURLToPath(import.meta.url));

const sdkEntrypoint = resolve(__dirname, '../src/index.ts');
const emojiEntrypoint = resolve(__dirname, '../src/components/Emojis/index.ts');
const browserBundleEntrypoint = resolve(__dirname, '../src/index_UMD.ts');
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

const packageJson = await import(resolve(__dirname, '../package.json'), {
  assert: { type: 'json' },
});
const deps = Object.keys(packageJson.default.dependencies);
const external = deps.filter((dep) => !bundledDeps.includes(dep));

const cjsBundleConfig = {
  entryPoints: [sdkEntrypoint, emojiEntrypoint],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'es2020',
  external,
  outdir: outDir,
  entryNames: '[dir]/[name].cjs',
  sourcemap: 'linked',
};

const browserBundleConfig = {
  entryPoints: [browserBundleEntrypoint],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  external: ['react', 'react-dom', 'stream-chat'],
  plugins: [
    globalExternals({
      react: {
        varName: 'React',
        type: 'cjs',
      },
      'react/jsx-runtime': {
        varName: 'React',
        type: 'cjs',
      },
      'react-dom': {
        varName: 'ReactDOM',
        type: 'cjs',
      },
      'stream-chat': {
        varName: 'StreamChat',
        type: 'cjs',
      },
    }),
  ],
  globalName: 'StreamChatReact',
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
