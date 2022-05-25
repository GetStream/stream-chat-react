import type { PlaywrightTestConfig } from '@playwright/test';

// https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
  retries: 2,
  testDir: './e2e',
  timeout: 15 * 1000,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    viewport: { height: 920, width: 1280 },
  },
  webServer: {
    command: 'ladle serve --open none',
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  workers: 1,
};

export default config;
