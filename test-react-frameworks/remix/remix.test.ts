/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-done-callback */

import { expect, test } from '@playwright/test';

test.describe('Remix', () => {
  test('MessageList rendered', async ({ page }) => {
    page.on('console', (message) => console.log('REMIX_LOGS: ', message.text()));

    await Promise.all([
      page.waitForSelector('.h-full'),
      page.waitForLoadState('networkidle'),
      page.goto('/'),
    ]);

    const list = page.locator('.str-chat__list');
    await expect(list).toBeVisible();
  });
});
