/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-done-callback */

import { expect, test } from '@playwright/test';

test.describe('Vite', () => {
  test('MessageList rendered', async ({ page }) => {
    page.on('console', (message) => console.log('VITE_LOGS: ', message.text()));

    await Promise.all([
      page.waitForSelector('#root'),
      page.waitForLoadState('networkidle'),
      page.goto('/'),
    ]);

    const list = page.locator('.str-chat__list');
    await expect(list).toBeVisible();
  });
});
