/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, Page, test } from '@playwright/test';

function getPreview(page: Page) {
  // with id:$eq filter there should be only one (add-message)
  return page.locator('data-testid=channel-preview-button');
}

test.describe('add a message', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await Promise.all([
      page.waitForSelector('data-testid=add-message'),
      page.goto(`${baseURL}/?story=connected-user--user1`),
      getPreview(page).click(),
    ]);
  });

  test('message list and preview button should be clear', async ({ page }) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/truncate') && r.ok()),
      page.click('data-testid=truncate'),
    ]);

    const list = page.locator('.str-chat__list');
    await expect(list).toBeEmpty();

    await expect(getPreview(page)).toContainText('Nothing yet...');
  });

  test('message list should update for current user', async ({ page }) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.click('data-testid=add-message'),
    ]);

    const list = page.locator('.str-chat__list');
    await expect(list).not.toBeEmpty();
    const newMessage = page.locator('.str-chat__message').first();
    await expect(newMessage).toContainText('Hello world!');
  });

  test('channel list should update for current user', async ({ page }) => {
    await expect(getPreview(page)).toContainText('Hello world!');
  });
});

test.describe('receive a message', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await Promise.all([
      page.waitForSelector('data-testid=add-message'),
      page.goto(`${baseURL}/?story=connected-user--user1`),
      getPreview(page).click(),
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.click('data-testid=add-message'),
    ]);

    await Promise.all([
      page.waitForSelector('data-testid=channel-preview-button'),
      page.goto(`${baseURL}/?story=connected-user--user2`),
    ]);
  });

  test('channel list should update for channel members and show unread', async ({ page }) => {
    const preview = getPreview(page);

    await expect(preview).toHaveClass(/str-chat__channel-preview-messenger--unread/);
    await expect(preview).toContainText('Hello world!');
  });

  test('message list should update for different users on the channel', async ({ page }) => {
    const preview = getPreview(page);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/read') && r.ok()),
      preview.click(),
    ]);

    await expect(preview).not.toHaveClass(/str-chat__channel-preview-messenger--unread/);

    const list = page.locator('.str-chat__list');
    await expect(list).not.toBeEmpty();
    const newMessage = page.locator('.str-chat__message').first();
    await expect(newMessage).toContainText('Hello world!');
  });
});
