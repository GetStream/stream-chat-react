import { resolve } from 'path';
import { defineConfig, type LibraryFormats } from 'vite';
import { dependencies, peerDependencies } from './package.json';
import { compilerOptions } from './tsconfig.lib.json';
import getPackageVersion from './scripts/get-package-version.mjs';

const external = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
  // regex patterns to match subpaths of external dependencies
  // e.g. @stream-io/abc and @stream-io/abc/xyz (without this, Vite bundles subpaths)
].map((dependency) => new RegExp(`^${dependency}(\\/[\\w-]+)?$`));

const formats: LibraryFormats[] = ['es', 'cjs'];

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, './src/index.ts'),
        emojis: resolve(__dirname, './src/plugins/Emojis/index.ts'),
        'mp3-encoder': resolve(__dirname, './src/plugins/encoders/mp3.ts'),
      },
    },
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    sourcemap: true,
    target: compilerOptions.target,
    rollupOptions: {
      external,
      output: formats.map((format) => {
        const extension = format === 'es' ? 'mjs' : 'js';

        return {
          format,
          chunkFileNames: `[format]/[name].[hash].${extension}`,
          entryFileNames: `[format]/[name].${extension}`,
          hashCharacters: 'hex',
        };
      }),
    },
  },
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
});
