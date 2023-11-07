/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/no-done-callback */

import { expect, test } from '@playwright/test';

test.describe('Next', () => {
  test('MessageList rendered', async ({ page }) => {
    page.on('console', (message) => console.log('NEXT_LOGS: ', message.text()));

    await Promise.all([
      page.waitForSelector('#__next'),
      page.waitForLoadState('networkidle'),
      page.goto('/'),
    ]);

    const list = page.locator('.str-chat__list');
    await expect(list).toBeVisible();
  });
});
