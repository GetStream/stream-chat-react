import type { PlaywrightTestConfig } from '@playwright/test';

export default {
  timeout: 15 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'yarn --cwd ./test-next-app dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 15 * 1000,
  },
} as PlaywrightTestConfig;
