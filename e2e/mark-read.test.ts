/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { expect, test } from '@playwright/test';

test.describe('mark read', () => {
  test.beforeEach(async ({ baseURL, page }) => {
    await page.goto(`${baseURL}/?story=mark-read--user1`, { waitUntil: 'networkidle' });
    // wait for page load
    await page.waitForSelector('data-testid=unread-count');

    const channelListItems = page.locator('.str-chat__channel-list-messenger__main > div');

    const listCount = await channelListItems.count();

    for (let i = 0; i < listCount; ++i) {
      // select channel
      // await channelListItems.nth(i).click();
      await page.click(`data-testid=channel-mr-channel-${i + 1}`);

      // wait for button to appear (channel window loaded)
      await page.waitForSelector('data-testid=truncate');
      await page.click('data-testid=truncate');
      // add message to channel add-message
      await page.click('data-testid=add-message');
    }

    await page.goto(`${baseURL}/?story=mark-read--user2`, { waitUntil: 'networkidle' });
    // wait for page load
    await page.waitForSelector('data-testid=unread-count');
  });

  test('unread count in "mr-channel-1" channel is 1', async ({ page }) => {
    const unreadCountSpan = page.locator(
      'data-testid=channel-mr-channel-1 >> data-testid=unread-count',
    );

    await expect(unreadCountSpan).toHaveText('1');
  });

  test('unread count changes to 0 after setting "mr-channel-1" channel as active', async ({
    page,
  }) => {
    await page.click('data-testid=channel-mr-channel-1');
    await page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1');

    const unreadCountSpan = page.locator(
      'data-testid=channel-mr-channel-1 >> data-testid=unread-count',
    );

    await expect(unreadCountSpan).toHaveText('0');
  });

  test('unread count stays 0 after switching channels', async ({ page }) => {
    await page.click('data-testid=channel-mr-channel-1');
    await page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1');

    await page.click('data-testid=channel-mr-channel-2');
    await page.waitForSelector('.str-chat__main-panel >> text=mr-channel-2');

    const unreadCountSpan1 = page.locator(
      'data-testid=channel-mr-channel-1 >> data-testid=unread-count',
    );

    const unreadCountSpan2 = page.locator(
      'data-testid=channel-mr-channel-2 >> data-testid=unread-count',
    );

    await expect(unreadCountSpan1).toHaveText('0');
    await expect(unreadCountSpan2).toHaveText('0');
  });

  test('unread count stays 0 after switching channels and reloading page', async ({ page }) => {
    await page.click('data-testid=channel-mr-channel-1');
    await page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1');

    const promise = page.waitForRequest(/\/read/);
    await page.click('data-testid=channel-mr-channel-2');
    await page.waitForSelector('.str-chat__main-panel >> text=mr-channel-2');

    await expect((await (await promise).response()).json()).resolves.toHaveProperty('event.type');

    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForSelector('data-testid=unread-count');

    const unreadCountSpan = page.locator(
      'data-testid=channel-mr-channel-2 >> data-testid=unread-count',
    );
    await expect(unreadCountSpan).toHaveText('0');
  });
});
