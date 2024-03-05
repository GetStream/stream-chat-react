/* eslint-disable jest/expect-expect */
import { expect, Page } from '@playwright/test';
import * as dotenv from 'dotenv';

import selectors from './user/selectors';
import { CustomTestContext, test } from './user/test';

import ChannelPreview from './user/components/ChannelPreview';
import Message from './user/components/Message/MessageSimple';
import MessageInput from './user/components/MessageInput';
import MessageList from './user/components/MessageList/MessageList';
import MessageNotification, {
  getMessageNotificationSelector,
} from './user/components/MessageList/MessageNotification';
import QuotedMessage from './user/components/Message/QuotedMessage';
import Thread, { composeThreadSelector } from './user/components/Thread/Thread';

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
const LAST_REPLY_TEXT = 'Message 299';
const MESSAGES_WITH_REPLIES = ['Message 149', 'Message 137', 'Message 124', 'Message 99'];
const FIRST_MESSAGE_FIRST_PAGE = 'Message 125';
const QUOTED_MESSAGES = ['Message 99', 'Message 137'];

const scrollInSteps = async (user: TestingUser, msgNumbers = ['142', '135', '128'], cycles = 3) => {
  for (let i = 0; i < cycles; i++) {
    await Promise.all(
      msgNumbers.map((num: string) => user.get(Message)(`Message ${num}`).scrollIntoViewIfNeeded()),
    );
  }
};

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
      const selector = composeThreadSelector(USER1_CHAT_VIEW_CLASSNAME);
      await user.sees(Thread).isScrolledToBottom(selector);
      await scrollInSteps(user, ['292', '285', '278']);
      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
        user.submits(MessageInput).reply(MY_ADDED_REPLY_TEXT),
      ]);

      await user.sees(Thread).isScrolledToBottom(selector);
    });

    test('not if I receive a message', async ({ controller, page, user }) => {
      const selector = composeThreadSelector(USER1_CHAT_VIEW_CLASSNAME);
      await user.sees(Thread).isScrolledToBottom(selector);
      await scrollInSteps(user, ['292', '285', '278']);

      await Promise.all([
        page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
        await controller.sendOtherUserReply(),
      ]);
      await user.sees(Thread).not.isScrolledToBottom(selector);
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
        `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer} li:last-of-type ${selectors.messageText}`,
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
    await scrollInSteps(user);

    await controller.sendOtherUserMessage();

    // click the notification
    await page.waitForSelector(getMessageNotificationSelector(NEW_MESSAGE_NOTIFICATION_TEXT));
    await user.clicks(MessageNotification).text(NEW_MESSAGE_NOTIFICATION_TEXT);

    // check that you are at the bottom
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer}`);
  });

  test('after loading more messages on new message notification click', async ({
    controller,
    page,
    user,
  }) => {
    // scroll without loading more messages
    await scrollInSteps(user);

    // trigger load more messages
    const firstLoadedMessage = await page.locator(
      `${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer} li:first-of-type`,
    );
    await firstLoadedMessage.scrollIntoViewIfNeeded();
    await controller.sendOtherUserMessage();

    // click the notification
    await page.waitForSelector(getMessageNotificationSelector(NEW_MESSAGE_NOTIFICATION_TEXT));
    await user.clicks(MessageNotification).text(NEW_MESSAGE_NOTIFICATION_TEXT);

    // check that you are at the bottom
    await user
      .sees(MessageList)
      .isScrolledToBottom(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageListContainer}`);
  });
});

test.describe('pagination', () => {
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory(
      'navigate-long-message-lists--user1',
      selectors.channelPreviewButton,
    );
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
  });

  test('does not lead to the viewport content change', async ({ page, user }) => {
    const messageList = await page.locator(`${USER1_CHAT_VIEW_CLASSNAME} ${selectors.messageList}`);

    const firstMessageFirstPage = await user.get(Message)(FIRST_MESSAGE_FIRST_PAGE);

    let firstLoadedMessageBoxBeforePagination;
    const msgListBoxBeforePagination = await messageList.boundingBox();

    // get message position before the next page of messages is received
    page.once('request', async () => {
      firstLoadedMessageBoxBeforePagination = await firstMessageFirstPage.boundingBox();
    });

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/query') && r.ok()),
      firstMessageFirstPage.scrollIntoViewIfNeeded(),
    ]);

    const msgListBoxAfterPagination = await messageList.boundingBox();
    const firstLoadedMessageBoxAfterPagination = await firstMessageFirstPage.boundingBox();

    const firstMessageShiftDistanceYToViewport =
      firstLoadedMessageBoxBeforePagination.y - firstLoadedMessageBoxAfterPagination.y;
    expect(firstMessageShiftDistanceYToViewport).toBeLessThanOrEqual(
      firstLoadedMessageBoxBeforePagination.height,
    );
    expect(firstMessageShiftDistanceYToViewport).toBeGreaterThanOrEqual(
      -firstLoadedMessageBoxBeforePagination.height,
    );
    expect(msgListBoxBeforePagination.height).not.toStrictEqual(msgListBoxAfterPagination.height);
  });
});
