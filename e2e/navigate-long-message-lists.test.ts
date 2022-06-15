import { expect, Page } from '@playwright/test';
import dotenv from 'dotenv';

import selectors from './user/selectors';
import { CustomTestContext, test } from './user/test';

import MessageInput from './user/components/MessageInput';
import Thread from './user/components/Thread/Thread';
import ChannelPreview from './user/components/ChannelPreview';
import Message from './user/components/Message/MessageSimple';
import QuotedMessage from './user/components/Message/QuotedMessage';

dotenv.config();
dotenv.config({ path: `.env.local` });
const user1Id = process.env.E2E_TEST_USER_1;

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const MY_ADDED_REPLY_TEXT = 'My reply' as const;
const OTHER_USER_ADDED_REPLY_TEXT = 'Reply back' as const;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;
const LAST_REPLY_TEXT = 'Message 299';
const MESSAGES_WITH_REPLIES = ['Message 149', 'Message 137', 'Message 124', 'Message 99'];

const QUOTED_MESSAGES = ['Message 99', 'Message 137'];

test.describe('thread autoscroll', () => {
  test.describe('on thread open', () => {
    test.beforeEach(async ({ controller, user }) => {
      await controller.openStory(
        'navigate-long-message-lists--user1',
        selectors.channelPreviewButton,
      );
      await user.clicks(ChannelPreview).text(CHANNEL_NAME);
    });

    const expectToOpenThreadAndSeeLatestMessage = async (
      page: Page,
      user: CustomTestContext['user'],
      messageText: string,
    ) => {
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
        user.clicks(Thread).openFor(messageText),
      ]);
      await user.sees(Message).displayed(LAST_REPLY_TEXT);
    };

    test('if I do not scroll primary msg list', async ({ page, user }) => {
      await expectToOpenThreadAndSeeLatestMessage(page, user, MESSAGES_WITH_REPLIES[0]);
    });

    test('if I load more messages by scrolling primary msg list', async ({ page, user }) => {
      const message = await user.get(Message)(MESSAGES_WITH_REPLIES[1]);
      await message.scrollIntoViewIfNeeded();
      await expectToOpenThreadAndSeeLatestMessage(page, user, MESSAGES_WITH_REPLIES[1]);
    });

    test('if I scroll primary message list by clicking a quoted message already loaded in state', async ({
      page,
      user,
    }) => {
      await user.clicks(QuotedMessage).nth(QUOTED_MESSAGES[0]);
      await expectToOpenThreadAndSeeLatestMessage(page, user, QUOTED_MESSAGES[0]);
    });

    test('if I scroll primary message list by clicking a quoted message that has to be loaded in state', async ({
      page,
      user,
    }) => {
      await user.clicks(QuotedMessage).nth(QUOTED_MESSAGES[1], 2);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/messages') && r.ok()),
        expectToOpenThreadAndSeeLatestMessage(page, user, QUOTED_MESSAGES[1]),
      ]);
    });
  });

  test.describe('on new message', () => {
    test.beforeEach(async ({ controller, page, user }) => {
      await controller.openStory(
        'navigate-long-message-lists--user1',
        selectors.channelPreviewButton,
      );
      await user.clicks(ChannelPreview).text(CHANNEL_NAME);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
        user.clicks(Thread).openFor(MESSAGES_WITH_REPLIES[0]),
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
      const avatars = await thread.locator(selectors.avatar);
      const message = await user.get(Message)('Message 270');
      await message.scrollIntoViewIfNeeded();
      await message.waitFor({ state: 'visible', timeout: 3000 });

      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
        user.submits(MessageInput).reply(MY_ADDED_REPLY_TEXT),
      ]);

      await expect(thread).toHaveScreenshot({
        mask: [avatars],
      });
    });

    test('not if I receive a message', async ({ controller, page, user }) => {
      const thread = await user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
      const avatars = await thread.locator(selectors.avatar);
      const message = await user.get(Message)('Message 270');
      await message.scrollIntoViewIfNeeded();
      await message.waitFor({ state: 'visible', timeout: 3000 });

      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
        await controller.sendOtherUserReply(),
      ]);

      await expect(thread).toHaveScreenshot({
        mask: [avatars],
      });
    });
  });
});
