import type { PlaywrightTestConfig } from '@playwright/test';

// https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    headless: true,
    viewport: { height: 920, width: 1280 },
  },
  webServer: {
    command: 'ladle serve --open none',
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
};

export default config;
