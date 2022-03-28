import type { PlaywrightTestConfig } from '@playwright/test';

// https://playwright.dev/docs/test-configuration
const config: PlaywrightTestConfig = {
  testDir: './e2e',
  webServer: {
    command: 'ladle serve --open none',
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  use: {
    viewport: { width: 1280, height: 920 },
  }
};

export default config;
