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
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: ['src/**/__tests__/**', 'src/mock-builders/**', 'src/@types/**'],
    },
  },
});
