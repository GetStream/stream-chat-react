import { expect } from '@playwright/test';

import selectors from './user/selectors';
import { test } from './user/test';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: `.env.local` });
const user1Id = process.env.E2E_TEST_USER_1;

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const MY_ADDED_REPLY_TEXT = 'My reply' as const;
const OTHER_USER_ADDED_REPLY_TEXT = 'Reply back' as const;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;

test.describe('thread autoscroll', () => {
  test.beforeEach(async ({controller, user, page}) => {
    await controller.openStory('navigate-long-message-lists--user1', selectors.channelPreviewButton);
    await user.clicks.ChannelPreview.text(CHANNEL_NAME);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/messages') && r.ok()),
      user.clicks.Thread.open('replies')
    ]);
  });

  test.afterEach(async ({controller, page}) => {
    const lastReplyText = await page.locator(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.threadReplyListWithReplies} li:last-of-type ${selectors.messageText}`).textContent()
    if (!lastReplyText) return;
    if (lastReplyText.match(OTHER_USER_ADDED_REPLY_TEXT)) {
      await controller.deleteOtherUserLastReply();
    } else if (lastReplyText.match(MY_ADDED_REPLY_TEXT)) {
      await controller.deleteMyLastReply();
    }
  })

  test('only if I send a message', async ({ user, page}) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      expect(await user.get.Thread(USER1_CHAT_VIEW_CLASSNAME)).toHaveScreenshot()
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.submits.MessageInput.reply(MY_ADDED_REPLY_TEXT)
    ]);

    const lastMessageTimeStamp = await page.locator(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.threadReplyListWithReplies} li:last-of-type ${selectors.messageTimestamp}`);
    await expect(await user.get.Thread(USER1_CHAT_VIEW_CLASSNAME)).toHaveScreenshot({mask:[lastMessageTimeStamp]});
  });

  test('not if I receive a message', async ({user, controller, page}) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      expect(await user.get.Thread(USER1_CHAT_VIEW_CLASSNAME)).toHaveScreenshot()
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      await controller.sendOtherUserReply()
    ]);
    await expect(await user.get.Thread(USER1_CHAT_VIEW_CLASSNAME)).toHaveScreenshot();
  });
})
