/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import selectors from './user/selectors';
import { test } from './user/test';
import { expect } from '@playwright/test';

// const CHANNEL_NAME = 'edit-message-channel';

test.describe('edit text message', () => {
  test.beforeEach(async ({ controller, page }) => {
    await controller.openStory('edit-message--user1', selectors.buttonAddMessage);
    await controller.clearChannel();

    await Promise.all([
      page.waitForSelector('.str-chat__message-attachment--card'),
      controller.sendMessage(),
    ]);
  });

  // eslint-disable-next-line require-await
  test('message has 3 attachments (2 cards and 1 gallery)', async ({ page }) => {
    expect(page.locator('.str-chat__message-attachment--card')).toHaveCount(2);
    expect(page.locator('.str-chat__message-attachment--gallery')).toHaveCount(1);
  });

  test('message has 2 attachments (1 card and 1 gallery) after updating text', async ({ page }) => {
    await page.hover(selectors.messageSimple);
    await page.click('button[aria-label="Open Message Actions Menu"]');

    await Promise.all([
      page.waitForSelector('.str-chat__modal--open'),
      page.click('.str-chat__message-actions-list-item >> text=Edit Message'),
    ]);

    await page.fill('data-testid=message-input', 'jest: https://jestjs.io/docs/cli');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector('.str-chat__message-attachment--card >> text=jestjs.io'),
      page.click('text=Send'),
    ]);

    expect(page.locator('.str-chat__message-attachment--card')).toHaveCount(1);
    expect(page.locator('.str-chat__message-attachment--gallery')).toHaveCount(1);
  });

  test('gallery attachment changes to image attachment after removing one image attachment', async ({
    page,
  }) => {
    await page.hover(selectors.messageSimple);
    await page.click('button[aria-label="Open Message Actions Menu"]');

    await Promise.all([
      page.waitForSelector('.str-chat__modal--open'),
      page.click('.str-chat__message-actions-list-item >> text=Edit Message'),
    ]);

    await page.locator('button[aria-label="Cancel upload"]').nth(0).press('Enter');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.waitForSelector('.str-chat__message-attachment--img'),
      page.click('text=Send'),
    ]);

    expect(page.locator('.str-chat__message-attachment--card')).toHaveCount(2);
    expect(page.locator('.str-chat__message-attachment--gallery')).toHaveCount(0);
    expect(page.locator('.str-chat__message-attachment--img')).toHaveCount(1);
  });

  test('message has only 1 attachment after removing all of the links from the message', async ({
    page,
  }) => {
    await page.hover(selectors.messageSimple);
    await page.click('button[aria-label="Open Message Actions Menu"]');

    await Promise.all([
      page.waitForSelector('.str-chat__modal--open'),
      page.click('.str-chat__message-actions-list-item >> text=Edit Message'),
    ]);

    await page.fill('data-testid=message-input', 'no links');

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      page.click('text=Send'),
    ]);

    expect(page.locator('.str-chat__message-attachment--card')).toHaveCount(0);
    expect(page.locator('.str-chat__message-attachment--gallery')).toHaveCount(1);
  });
});
