import type { PlaywrightTestConfig } from '@playwright/test';

// https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  maxFailures: 1,
  retries: 2,
  testDir: './e2e',
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    viewport: { height: 920, width: 1280 },
  },
  webServer: {
    command: 'npx ladle serve --open none',
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  workers: 1,
};

export default config;
