import { resolve } from 'path';
import { defineConfig, type Plugin } from 'vitest/config';
import { transform } from 'esbuild';
import getPackageVersion from './scripts/get-package-version.mjs';

// Vite's import-analysis plugin parses .js files before esbuild transforms them,
// so JSX in .js files causes parse errors. This plugin pre-transforms .js files
// containing JSX using esbuild before the import-analysis step.
function jsxInJs(): Plugin {
  return {
    enforce: 'pre',
    name: 'treat-js-as-jsx',
    async transform(code, id) {
      if (/\.js$/.test(id) && /[<][\w/]/.test(code)) {
        const result = await transform(code, {
          jsx: 'automatic',
          loader: 'jsx',
          sourcefile: id,
          sourcemap: 'inline',
        });
        return { code: result.code, map: null };
      }
    },
  };
}

export default defineConfig({
  plugins: [jsxInJs()],
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
  resolve: {
    alias: {
      'mock-builders': resolve(__dirname, 'src/mock-builders'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{js,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/examples/**', '**/__snapshots__/**', '**/e2e/**'],
    pool: 'forks',
    watch: false,
    testTimeout: 15000,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**'],
      exclude: ['src/**/__tests__/**', 'src/mock-builders/**'],
    },
  },
});
