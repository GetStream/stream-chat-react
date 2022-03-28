import type { PlaywrightTestConfig } from '@playwright/test';

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
