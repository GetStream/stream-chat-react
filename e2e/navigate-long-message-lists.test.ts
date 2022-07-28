import { expect } from '@playwright/test';
import dotenv from 'dotenv';

import selectors from './user/selectors';
import { test } from './user/test';

import ChannelPreview from './user/components/ChannelPreview';
import Message from './user/components/Message/MessageSimple';
import MessageInput from './user/components/MessageInput';
import MessageList from './user/components/MessageList/MessageList';
import MessageNotification, {
  getMessageNotificationSelector,
} from './user/components/MessageList/MessageNotification';
import Thread from './user/components/Thread/Thread';

import type { TestingUser } from './user/User';

dotenv.config();
dotenv.config({ path: `.env.local` });
const user1Id = process.env.E2E_TEST_USER_1;

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const MY_ADDED_REPLY_TEXT = 'My reply' as const;
const OTHER_USER_ADDED_REPLY_TEXT = 'Reply back' as const;
const OTHER_USER_ADDED_MESSAGE_TEXT = "Other user's message" as const;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;
const NEW_MESSAGE_NOTIFICATION_TEXT = 'New Messages!' as const;

test.describe('thread autoscroll', () => {
  test.beforeEach(async ({ controller, page, user }) => {
    await controller.openStory(
      'navigate-long-message-lists--user1',
      selectors.channelPreviewButton,
    );
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      user.clicks(Thread).open('replies', -1),
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
    const thread = user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const avatars = thread.locator(selectors.avatar);
    await page.mouse.move(0, 0);
    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.submits(MessageInput).reply(MY_ADDED_REPLY_TEXT),
    ]);
    await page.mouse.move(0, 0);
    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
  });

  test('not if I receive a message', async ({ controller, page, user }) => {
    const thread = user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const avatars = thread.locator(selectors.avatar);
    await page.mouse.move(0, 0);
    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      await controller.sendOtherUserReply(),
    ]);
    await page.mouse.move(0, 0);
    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
  });
});

test.describe('scroll to the bottom', () => {
  const scrollInSteps = async (user: TestingUser, cycles = 1) => {
    for (let i = 0; i < cycles; i++) {
      await Promise.all(
        ['142', '135', '128'].map((num: string) =>
          user.get(Message)(`Message ${num}`).scrollIntoViewIfNeeded(),
        ),
      );
    }
  };
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory(
      'navigate-long-message-lists--user1',
      selectors.channelPreviewButton,
    );
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
  });

  test.afterEach(async ({ controller, page }) => {
    const lastMessage = await page
      .locator(
        `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList} li:last-of-type ${selectors.messageText}`,
      )
      .textContent();
    if (!lastMessage) return;
    if (lastMessage.match(OTHER_USER_ADDED_MESSAGE_TEXT)) {
      await controller.deleteOtherUserLastMessage();
    }
  });

  test('without loading more messages on new message notification click', async ({
    controller,
    page,
    user,
  }) => {
    // scroll without loading more messages
    await scrollInSteps(user, 3);

    await controller.sendOtherUserMessage();

    // click the notification
    await page.waitForSelector(getMessageNotificationSelector(NEW_MESSAGE_NOTIFICATION_TEXT));
    await user.clicks(MessageNotification).text(NEW_MESSAGE_NOTIFICATION_TEXT);

    // check that you are at the bottom
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`);
  });

  test('after loading more messages on new message notification click', async ({
    controller,
    page,
    user,
  }) => {
    // scroll without loading more messages
    await scrollInSteps(user, 3);

    // trigger load more messages
    const firstLoadedMessage = await page.locator(
      `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList} li:first-of-type`,
    );
    await firstLoadedMessage.scrollIntoViewIfNeeded();
    await controller.sendOtherUserMessage();

    // click the notification
    await page.waitForSelector(getMessageNotificationSelector(NEW_MESSAGE_NOTIFICATION_TEXT));
    await user.clicks(MessageNotification).text(NEW_MESSAGE_NOTIFICATION_TEXT);

    // check that you are at the bottom
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`);
  });
});
