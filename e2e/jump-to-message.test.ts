/* eslint-disable jest/require-top-level-describe */
import { expect, test } from '@playwright/test';

test.describe('jump to message', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=jump-to-message--jump-in-virtualized-message-list`);
    await page.waitForSelector('[data-storyloaded]');
  });

  test('jumps to message 29', async ({ page }) => {
    await page.waitForSelector('[data-item-index="10000024"]');
    await page.click('data-testid=jump-to-message');
    const message29 = page.locator('[data-index="29"]');
    // console.log(await message29.innerText());
    await expect(message29).toBeVisible();
    await expect(message29).toContainText('Message 29');
  });
});
