/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, Page, test } from '@playwright/test';

test.describe('autocomplete a mention', () => {
  test('message list should clear', async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=hello--basic-setup`);
    await page.waitForSelector('[data-storyloaded]');
    await page.fill('data-testid=message-input', '@');
    await page.click('text=test-user-2');
    await expect(page.locator('data-testid=message-input')).toContainText('@test-user-2');
  });
});
