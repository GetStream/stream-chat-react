/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, test } from '@playwright/test';

test.describe('add message', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=add-message--send-message-in-message-list`);
    await page.waitForSelector('[data-storyloaded]');
  });

  test('message list should clear', async ({ page }) => {
    await page.click('data-testid=truncate');
    const list = page.locator('.str-chat__list');
    await expect(list).toBeEmpty();
  });

  test('channel list preview should be cleared', async ({ page }) => {
    // Empty channels always appear last when sorting by last_message_at
    const lastPreview = page.locator('data-testid=channel-preview-button').last();
    await expect(lastPreview).toContainText('Nothing yet...');
  });

  test('message list should update for current user', async ({ page }) => {
    await page.click('data-testid=add-message');
    const list = page.locator('.str-chat__list');
    await expect(list).not.toBeEmpty();
    const newMessage = page.locator('.str-chat__message').first();
    await expect(newMessage).toContainText('Hello world!');
  });

  test('channel list should update for current user', async ({ page }) => {
    const firstPreview = page.locator('data-testid=channel-preview-button').first();
    await expect(firstPreview).toContainText('Hello world!');
  });
});
