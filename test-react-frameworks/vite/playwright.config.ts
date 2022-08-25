import type { PlaywrightTestConfig } from '@playwright/test';

export default {
  timeout: 15 * 1000,
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'yarn --cwd ./test-vite-app dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 15 * 1000,
  },
} as PlaywrightTestConfig;
