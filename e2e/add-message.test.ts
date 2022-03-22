/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, Page, test } from '@playwright/test';

function getPreview(page: Page) {
  return page.locator('*data-testid=channel-preview-button >> text=add-message');
}

test.describe('add message', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=add-message--send-message-in-message-list`);
    await page.waitForSelector('[data-storyloaded]');
    // Select correct channel
    const preview = getPreview(page);
    await preview.click();
  });

  test('message list should clear', async ({ page }) => {
    await page.click('data-testid=truncate');
    const list = page.locator('.str-chat__list');
    await expect(list).toBeEmpty();
  });

  test('channel list preview should be cleared', async ({ page }) => {
    const preview = getPreview(page);
    await expect(preview).toContainText('Nothing yet...');
  });

  test('message list should update for current user', async ({ page }) => {
    await page.click('data-testid=add-message');
    const list = page.locator('.str-chat__list');
    await expect(list).not.toBeEmpty();
    const newMessage = page.locator('.str-chat__message').first();
    await expect(newMessage).toContainText('Hello world!');
  });

  test('channel list should update for current user', async ({ page }) => {
    const preview = getPreview(page);
    await expect(preview).toContainText('Hello world!');
  });
});
