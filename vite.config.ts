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

// Entries no export reaches in a format: the A2UI renderer is an ES module only, and what
// `require` of it reaches is its CJS stub alone.
const unreachableEntries: Partial<Record<LibraryFormats, string[]>> = {
  cjs: ['a2ui'],
  es: ['a2ui-require'],
};

type OutputBundle = Record<
  string,
  | {
      dynamicImports: string[];
      fileName: string;
      imports: string[];
      isEntry: boolean;
      name: string;
      type: 'chunk';
    }
  | { fileName: string; type: 'asset' }
>;

// Leaves out of a format's output its unreachable entries, with the chunks and source maps
// only they reach, so the package ships no code nothing can load.
const withoutUnreachableEntries = (format: LibraryFormats) => ({
  name: 'without-unreachable-entries',
  generateBundle(_: unknown, bundle: OutputBundle) {
    const dropped = unreachableEntries[format] ?? [];
    if (!dropped.length) return;
    const reached = new Set<string>();
    const reach = (fileName: string) => {
      const file = bundle[fileName];
      if (!file || file.type !== 'chunk' || reached.has(fileName)) return;
      reached.add(fileName);
      [...file.imports, ...file.dynamicImports].forEach(reach);
    };
    Object.values(bundle).forEach((file) => {
      if (file.type === 'chunk' && file.isEntry && !dropped.includes(file.name)) {
        reach(file.fileName);
      }
    });
    Object.values(bundle).forEach((file) => {
      if (file.type !== 'chunk' || reached.has(file.fileName)) return;
      delete bundle[file.fileName];
      delete bundle[`${file.fileName}.map`];
    });
  },
});

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, './src/index.ts'),
        'channel-detail': resolve(__dirname, './src/plugins/ChannelDetail/index.ts'),
        emojis: resolve(__dirname, './src/plugins/Emojis/index.ts'),
        'mp3-encoder': resolve(__dirname, './src/plugins/encoders/mp3.ts'),
        'slot-geometry': resolve(__dirname, './src/plugins/SlotGeometry/index.ts'),
        'slot-layout': resolve(__dirname, './src/plugins/SlotLayout/index.tsx'),
        'ai-components': resolve(__dirname, './src/plugins/AIComponents/index.ts'),
        a2ui: resolve(__dirname, './src/plugins/A2UI/index.ts'),
        // What `require` reaches: the renderer is an ES module only, and says so.
        'a2ui-require': resolve(__dirname, './src/plugins/A2UI/esmOnly.ts'),
        openui: resolve(__dirname, './src/plugins/OpenUI/index.ts'),
      },
    },
    // `yarn build` already wipes dist up front via `yarn clean`
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
          // Emit the ESM build as one file per source module. Consumer bundlers
          // drop whole modules (guided by our package.json `sideEffects`) before
          // they attempt statement-level elimination. The CJS build stays chunked,
          // as CJS is not tree-shaken by consumers either way.
          preserveModules: format === 'es',
          plugins: [withoutUnreachableEntries(format)],
        };
      }),
    },
  },
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
});
