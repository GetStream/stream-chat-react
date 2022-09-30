/* eslint-disable jest/expect-expect */
import { expect } from '@playwright/test';
import { test } from './user/test';
import selectors from './user/selectors';

import MessageActionsBox from './user/components/MessageActions/MessageActionsBox';

test.describe('pin message', () => {
  test.beforeEach(async ({ controller }) => {
    await controller.openStory('pin-message--user1', selectors.buttonAddMessage);
    await controller.clearChannel();
    await controller.sendMessage('text="pin-message-2"');
  });

  test('pin message list loads with one pinned message', async ({ page }) => {
    const locator = page.locator(`${selectors.pinnedMessagesList} >> li`);
    await expect(locator).toHaveCount(1);
  });

  test('pin message list updates on pin', async ({ page, user }) => {
    await Promise.all([
      page.waitForSelector(`${selectors.pinnedMessagesList} >> text=pin-message-2`),
      user.clicks(MessageActionsBox).pin('pin-message-2'),
    ]);

    const locator = page.locator(`${selectors.pinnedMessagesList} >> li`);
    await expect(locator).toHaveCount(2);
  });

  test('pin message list updates on unpin', async ({ page, user }) => {
    await Promise.all([
      page.waitForSelector(selectors.pinnedMessagesList, { state: 'detached' }),
      user.clicks(MessageActionsBox).unpin('pin-message-1'),
    ]);

    const locator = page.locator(selectors.pinnedMessagesList);
    await expect(locator).toBeHidden();
  });
});
