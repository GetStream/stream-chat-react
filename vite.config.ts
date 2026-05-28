import { resolve } from 'path';
import { defineConfig, type LibraryFormats } from 'vite';
import { dependencies, peerDependencies } from './package.json';
import { compilerOptions } from './tsconfig.lib.json';
import getPackageVersion from './scripts/get-package-version.mjs';

const external = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
  // regex patterns to match subpaths of external dependencies at any depth
  // e.g. dayjs/locale/de, @stream-io/abc/xyz/inner (without this, Vite/Rolldown
  // bundles the subpath module, which can drag CJS `require()` glue into ESM output)
].map((dependency) => new RegExp(`^${dependency}(\\/.+)?$`));

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
        // Hardcode the output dir per format — under vite 8 / rolldown 1 the
        // `[format]` placeholder expands to "esm" instead of "es", which
        // would break our package.json `exports` pointing at `./dist/es/...`.
        const dir = format === 'es' ? 'es' : 'cjs';

        return {
          format,
          chunkFileNames: `${dir}/[name].[hash].${extension}`,
          entryFileNames: `${dir}/[name].${extension}`,
          hashCharacters: 'hex',
        };
      }),
    },
  },
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
});
