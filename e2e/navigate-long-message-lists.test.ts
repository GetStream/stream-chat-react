import { expect } from '@playwright/test';
import dotenv from 'dotenv';

import selectors from './user/selectors';
import { test } from './user/test';

import MessageInput from './user/components/MessageInput';
import Thread from './user/components/Thread/Thread';
import ChannelPreview from './user/components/ChannelPreview';

dotenv.config();
dotenv.config({ path: `.env.local` });
const user1Id = process.env.E2E_TEST_USER_1;

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const MY_ADDED_REPLY_TEXT = 'My reply' as const;
const OTHER_USER_ADDED_REPLY_TEXT = 'Reply back' as const;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;

test.describe('thread autoscroll', () => {
  test.beforeEach(async ({ controller, page, user }) => {
    await controller.openStory(
      'navigate-long-message-lists--user1',
      selectors.channelPreviewButton,
    );
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/messages') && r.ok()),
      user.clicks(Thread).open('replies'),
    ]);
  });

  test.afterEach(async ({ controller, page }) => {
    const lastReplyText = await page
      .locator(
        `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.threadReplyListWithReplies} li:last-of-type ${selectors.messageText}`,
      )
      .textContent();
    if (!lastReplyText) return;
    if (lastReplyText.match(OTHER_USER_ADDED_REPLY_TEXT)) {
      await controller.deleteOtherUserLastReply();
    } else if (lastReplyText.match(MY_ADDED_REPLY_TEXT)) {
      await controller.deleteMyLastReply();
    }
  });

  test('only if I send a message', async ({ page, user }) => {
    let thread = await user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const messageData = await thread.locator(selectors.messageData);
    const avatars = await thread.locator(selectors.avatar);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      expect(thread).toHaveScreenshot({
        mask: [messageData, avatars],
      }),
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.submits(MessageInput).reply(MY_ADDED_REPLY_TEXT),
    ]);

    await expect(thread).toHaveScreenshot({
      mask: [messageData, avatars],
    });
  });

  test('not if I receive a message', async ({ controller, page, user }) => {
    const thread = await user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const messageData = await thread.locator(selectors.messageData);
    const avatars = await thread.locator(selectors.avatar);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      expect(thread).toHaveScreenshot({
        mask: [messageData, avatars],
      }),
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      await controller.sendOtherUserReply(),
    ]);
    await expect(thread).toHaveScreenshot({
      mask: [messageData, avatars],
    });
  });
});
