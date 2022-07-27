import { expect } from '@playwright/test';
import dotenv from 'dotenv';

import selectors from './user/selectors';
import { test } from './user/test';

import MessageInput from './user/components/MessageInput';
import Thread from './user/components/Thread/Thread';
import ChannelPreview from './user/components/ChannelPreview';
import MessageNotification from './user/components/MessageList/MessageNotification';

dotenv.config();
dotenv.config({ path: `.env.local` });
const user1Id = process.env.E2E_TEST_USER_1;

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const MY_ADDED_REPLY_TEXT = 'My reply' as const;
const OTHER_USER_ADDED_REPLY_TEXT = 'Reply back' as const;
const OTHER_USER_ADDED_MESSAGE_TEXT = "Other user's message" as const;
const USER1_CHAT_VIEW_CLASSNAME = `.${user1Id}`;

test.describe('thread autoscroll', () => {
  test.beforeEach(async ({ controller, page, user }) => {
    await controller.openStory(
      'navigate-long-message-lists--user1',
      selectors.channelPreviewButton,
    );
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
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
    const thread = user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const avatars = thread.locator(selectors.avatar);

    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.submits(MessageInput).reply(MY_ADDED_REPLY_TEXT),
    ]);

    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
  });

  test('not if I receive a message', async ({ controller, page, user }) => {
    const thread = user.get(Thread)(USER1_CHAT_VIEW_CLASSNAME);
    const avatars = thread.locator(selectors.avatar);

    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      await controller.sendOtherUserReply(),
    ]);
    await expect(thread).toHaveScreenshot({
      mask: [avatars],
    });
  });
});

test.describe('scroll to the bottom', () => {
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
    // scroll up to load more messages
    const messageList = page.locator(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`);
    const messageListBox = await messageList.boundingBox();
    const scrollBarClickTarget = { x: (messageListBox?.width || 1) - 1, y: 5 };
    // multiple scroll events have to be triggered in order to turn off ResizeObserver
    // the current implementation seems very fragile
    await messageList.click({ clickCount: 5, position: scrollBarClickTarget });

    await controller.sendOtherUserMessage();
    // click the notification
    await user.clicks(MessageNotification).text('New Messages!');
    // check that you are at the bottom
    const isScrolledToBottom = await page.evaluate(
      ([selector]) => {
        const messageList = document.querySelector(selector);
        if (!messageList) return false;
        return messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight;
      },
      [`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`],
    );
    expect(isScrolledToBottom).toBeTruthy();
  });

  test('after loading more messages on new message notification click', async ({
    controller,
    page,
    user,
  }) => {
    // scroll up to load more messages
    const messageList = page.locator(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`);
    const messageListBox = await messageList.boundingBox();
    const scrollBarClickTarget = { x: (messageListBox?.width || 1) - 1, y: 5 };
    // multiple scroll events have to be triggered in order to turn off ResizeObserver
    // the current implementation seems very fragile
    await messageList.click({ clickCount: 5, position: scrollBarClickTarget });
    const firstLoadedMessage = await page.locator(
      `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList} li:first-of-type`,
    );
    await firstLoadedMessage.scrollIntoViewIfNeeded();
    await controller.sendOtherUserMessage();
    // click the notification
    await user.clicks(MessageNotification).text('New Messages!');
    // check that you are at the bottom
    const isScrolledToBottom = await page.evaluate(
      ([selector]) => {
        const messageList = document.querySelector(selector);
        if (!messageList) return false;
        return messageList.scrollTop + messageList.clientHeight === messageList.scrollHeight;
      },
      [`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`],
    );
    expect(isScrolledToBottom).toBeTruthy();
  });
});
