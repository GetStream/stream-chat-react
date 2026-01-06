import { resolve } from 'path';
import { defineConfig } from 'vite';
import { name, dependencies, peerDependencies } from './package.json';
import { compilerOptions } from './tsconfig.lib.json';
import getPackageVersion from './scripts/get-package-version.mjs';

const external = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
  // regex patterns to match subpaths of external dependencies
  // e.g. @stream-io/abc and @stream-io/abc/xyz (without this, Vite bundles subpaths)
].map((dependency) => new RegExp(`^${dependency}(\\/[\\w-]+)?$`));

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, './src/index.ts'),
        emojis: resolve(__dirname, './src/plugins/Emojis/index.ts'),
        'mp3-encoder': resolve(__dirname, './src/plugins/encoders/mp3.ts'),
        experimental: resolve(__dirname, './src/experimental/index.ts'),
      },
      fileName(format, entryName) {
        return `${format}/${entryName}.${format === 'cjs' ? 'js' : 'mjs'}`;
      },
      name,
    },
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    target: compilerOptions.target,
    rollupOptions: {
      external,
    },
  },
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
});
