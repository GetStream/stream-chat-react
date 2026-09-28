import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import getPackageVersion from './scripts/get-package-version.mjs';

export default defineConfig({
  define: {
    'process.env.STREAM_CHAT_REACT_VERSION': JSON.stringify(getPackageVersion()),
  },
  resolve: {
    alias: {
      'mock-builders': resolve(__dirname, 'src/mock-builders'),
    },
    // `stream-chat`, `@stream-io/i18n` and this package each depend on `@stream-io/state-store`,
    // and they hand each other store instances. A plain install dedupes them, but a linked
    // `stream-chat` checkout brings its own nested copy along — two `StateStore` classes, so
    // `instanceof` and identity checks across the boundary stop holding. Resolve these from the
    // project root always, so a test run exercises one copy of each the way an app does.
    dedupe: [
      '@stream-io/state-store',
      '@stream-io/i18n',
      'stream-chat',
      'react',
      'react-dom',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/examples/**', '**/__snapshots__/**', '**/e2e/**'],
    pool: 'forks',
    watch: false,
    testTimeout: 15000,
    fileParallelism: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'text-summary'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/mock-builders/**',
        'src/@types/**',
        'src/**/*.json',
      ],
    },
  },
});
