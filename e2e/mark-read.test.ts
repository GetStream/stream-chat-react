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

    for (let i = 1; i <= listCount; ++i) {
      // select channel
      await Promise.all([
        page.waitForSelector(`.str-chat__main-panel >> text=mr-channel-${i}`),
        page.click(`data-testid=channel-mr-channel-${i}`),
      ]);

      // truncate messages
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/truncate') && r.ok()),
        page.click('data-testid=truncate'),
      ]);

      // add message to channel
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
        page.click('data-testid=add-message'),
      ]);
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
    await Promise.all([
      page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1'),
      page.click('data-testid=channel-mr-channel-1'),
    ]);

    const unreadCountSpan = page.locator(
      'data-testid=channel-mr-channel-1 >> data-testid=unread-count',
    );

    await expect(unreadCountSpan).toHaveText('0');
  });

  test('unread count stays 0 after switching channels', async ({ page }) => {
    await Promise.all([
      page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1'),
      page.click('data-testid=channel-mr-channel-1'),
    ]);

    await Promise.all([
      page.waitForSelector('.str-chat__main-panel >> text=mr-channel-2'),
      page.click('data-testid=channel-mr-channel-2'),
    ]);

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
    await Promise.all([
      page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1'),
      page.click('data-testid=channel-mr-channel-1'),
    ]);

    // click on channel-2 and await response
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/mr-channel-2/read') && r.ok()),
      page.click('data-testid=channel-mr-channel-2'),
    ]);

    // reload the page
    await Promise.all([
      page.waitForSelector('data-testid=unread-count'),
      page.reload({ waitUntil: 'networkidle' }),
    ]);

    const unreadCountSpan = page.locator(
      'data-testid=channel-mr-channel-2 >> data-testid=unread-count',
    );

    await expect(unreadCountSpan).toHaveText('0');
  });
});
