import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'path';
import type { BrowserCommand } from 'vitest/node';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import type { PlaywrightBrowserProvider } from '@vitest/browser-playwright';
import getPackageVersion from './scripts/get-package-version.mjs';

const BROWSER_TEST_GLOB = 'src/**/*.browser.test.{ts,tsx}';

/** Where the browser suites write the scroll traces compared by `scripts/compare-virtuoso-traces.mts`. */
const VIRTUOSO_TRACE_DIR = resolve(__dirname, '.virtuoso-traces');

// Lets a browser test persist a trace: the test runs in the page, which has no file system.
const writeVirtuosoTrace: BrowserCommand<[name: string, json: string]> = async (
  { project },
  name,
  json,
) => {
  // `project.name` carries the browser instance, e.g. `browser-v4 (chromium)`.
  const runtime = project.name.replace(/ \(.*\)$/, '');
  const file = resolve(VIRTUOSO_TRACE_DIR, runtime, `${name}.json`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, json);
};

// CPU throttling through the Chrome DevTools Protocol, for scenarios that only fail under load.
const setCpuThrottlingRate: BrowserCommand<[rate: number]> = async (context, rate) => {
  if (context.provider.name !== 'playwright') return false;
  const { page } = (context.provider as PlaywrightBrowserProvider).getCommandsContext(
    context.sessionId,
  );
  if (page.context().browser()?.browserType().name() !== 'chromium') return false;
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate });
  return true;
};

/**
 * A real-layout project. `virtuosoModule` swaps the `react-virtuoso` runtime the SDK source is
 * bundled against, so the same suites run against two versions and their traces can be diffed.
 */
const browserProject = (name: string, virtuosoModule?: string) => ({
  define: {
    VIRTUOSO_TEST_FUZZ_SEEDS: JSON.stringify(process.env.VIRTUOSO_FUZZ_SEEDS ?? ''),
    VIRTUOSO_TEST_MUTATION: JSON.stringify(process.env.VIRTUOSO_MUTATION ?? ''),
    VIRTUOSO_TEST_RUNTIME: JSON.stringify(name),
  },
  extends: true as const,
  // Discovered late, these would make Vite re-optimize and reload the page mid-run.
  optimizeDeps: {
    include: ['react-dom/client', virtuosoModule ?? 'react-virtuoso', 'stream-chat'],
  },
  resolve: virtuosoModule
    ? { alias: [{ find: /^react-virtuoso$/, replacement: virtuosoModule }] }
    : undefined,
  test: {
    browser: {
      commands: { setCpuThrottlingRate, writeVirtuosoTrace },
      enabled: true,
      headless: true,
      instances: [{ browser: 'chromium' as const }],
      provider: playwright({ contextOptions: { timezoneId: 'UTC' } }),
      screenshotFailures: false,
      viewport: { height: 900, width: 1200 },
    },
    css: true,
    // Real layout and timing: suites in one file must not race each other's frames.
    fileParallelism: false,
    globals: true,
    include: [BROWSER_TEST_GLOB],
    name,
    setupFiles: ['./vitest.browser.setup.ts'],
    testTimeout: 60000,
  },
});

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
    coverage: {
      exclude: [
        'src/**/__tests__/**',
        'src/mock-builders/**',
        'src/@types/**',
        'src/**/*.json',
      ],
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      provider: 'v8',
      reporter: ['json', 'text-summary'],
    },
    projects: [
      {
        extends: true,
        test: {
          css: false,
          environment: 'jsdom',
          exclude: [
            '**/node_modules/**',
            '**/examples/**',
            '**/__snapshots__/**',
            '**/e2e/**',
            BROWSER_TEST_GLOB,
          ],
          fileParallelism: true,
          globals: true,
          include: ['src/**/*.test.{js,jsx,ts,tsx}'],
          name: 'jsdom',
          pool: 'forks',
          setupFiles: ['./vitest.setup.ts'],
          testTimeout: 15000,
        },
      },
      // The runtime the package ships with.
      browserProject('browser-v4'),
      // The previous runtime, kept only while the react-virtuoso v4 upgrade is verified.
      browserProject('browser-v2', 'react-virtuoso-v2'),
    ],
    watch: false,
  },
});
