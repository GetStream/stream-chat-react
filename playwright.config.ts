import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  webServer: {
    command: 'ladle serve --open none',
    port: 61000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
};

export default config;
