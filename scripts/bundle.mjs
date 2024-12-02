#!/usr/bin/env node

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import { replace } from 'esbuild-plugin-replace';

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

const packageJson = await import(resolve(__dirname, '../package.json'), {
  assert: { type: 'json' },
});
const deps = Object.keys({
  ...packageJson.default.dependencies,
  ...packageJson.default.peerDependencies,
});
const external = deps.filter((dep) => !bundledDeps.includes(dep));

/** @type esbuild.BuildOptions */
const cjsBundleConfig = {
  entryPoints: [sdkEntrypoint, emojiEntrypoint, mp3EncoderEntrypoint, experimentalEntrypoint],
  bundle: true,
  format: 'cjs',
  target: 'es2020',
  external,
  outdir: outDir,
  outExtension: { '.js': '.cjs' },
  sourcemap: 'linked',
};

// Get the latest version so that magic string __STREAM_CHAT_REACT_VERSION__ can be replaced with it in the source code (used for reporting purposes)
const getVersion = () => {
    let version;
    // During release, use the version being released
    // see .releaserc.json where the `NEXT_VERSION` env variable is set
    if (process.env.NEXT_VERSION) {
        version = process.env.NEXT_VERSION;
    } else {
        // Otherwise use the latest git tag
        try {
            version = execSync('git describe --tags --abbrev=0').toString().trim();
        } catch (error) {
            console.error(error);
            console.warn('Could not get latest version from git tags, falling back to package.json');
            version = packageJson.default.version;
        }
    }
    console.log(`Determined the build package version to be ${version}`);
    return version;
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
          '__STREAM_CHAT_REACT_VERSION__': getVersion(),
        }),
    ],
  }),
);
await Promise.all(bundles);
