/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import selectors from './user/selectors';
import { test } from './user/test';

import ChannelPreview from './user/components/ChannelPreview';
import MessageList from './user/components/MessageList/MessageList';
import MessageActions from './user/components/MessageActions/MessageActions';
import Thread from './user/components/Thread/Thread';
import MessageInput from './user/components/MessageInput';

const CHANNEL_NAME = 'add-message' as const;
const ADDED_MESSAGE_MAIN_LIST = 'Hello world!' as const;
const ADDED_MESSAGE_THREAD = 'Hello world back!' as const;

test.describe('add text message', () => {
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
  });

  test('message list and preview button should be clear', async ({ controller, user }) => {
    await controller.clearChannel();
    await user.sees(MessageList).empty();
    await user.sees(ChannelPreview)(CHANNEL_NAME).empty();
  });

  test('message list should update for current user', async ({ controller, user }) => {
    await controller.sendMessage();

    await user.sees(MessageList).not.empty();
    await user.sees(MessageList).contains.nthMessage(ADDED_MESSAGE_MAIN_LIST);
    await user.sees(ChannelPreview)(CHANNEL_NAME).contains.lastMessage(ADDED_MESSAGE_MAIN_LIST);
  });
});

test.describe('receive a message', () => {
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);

    await user.clicks(ChannelPreview).text(CHANNEL_NAME);

    await controller.sendMessage();

    await controller.openStory('add-message--user2', selectors.channelPreviewButton);
  });

  test('channel list should update for channel members and show unread', async ({ user }) => {
    await user.sees(ChannelPreview)(CHANNEL_NAME).not.read();
    await user.sees(ChannelPreview)(CHANNEL_NAME).contains.lastMessage(ADDED_MESSAGE_MAIN_LIST);
  });

  test('message list should update for different users on the channel', async ({ page, user }) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/read') && r.ok()),
      user.clicks(ChannelPreview).text(CHANNEL_NAME),
    ]);
    await user.sees(MessageList).not.empty();
    await user.sees(ChannelPreview)(CHANNEL_NAME).read();
    await user.sees(MessageList).contains.nthMessage(ADDED_MESSAGE_MAIN_LIST);
  });
});

test.describe('reply to a message', () => {
  test.beforeEach(async ({ controller, user }) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await user.clicks(ChannelPreview).text(CHANNEL_NAME);
  });

  test.afterEach(async ({ user }) => {
    await user.clicks(Thread).close();
  });

  test('thread with no replies contains only parent message', async ({ controller, user }) => {
    await controller.clearChannel();
    await controller.sendMessage();
    await user.clicks(MessageActions).reply(ADDED_MESSAGE_MAIN_LIST);
    await user.sees(Thread).empty();
  });

  test('reply to a message should appear at the bottom of the thread and in channel preview', async ({
    user,
  }) => {
    await user.clicks(MessageActions).reply(ADDED_MESSAGE_MAIN_LIST);
    await user.submits(MessageInput).reply(ADDED_MESSAGE_THREAD);
    await user.sees(Thread).not.empty();
    await user.sees(Thread).inViewport.nthMessage(ADDED_MESSAGE_THREAD, -1);
    // todo: channel preview does not reflect new messages from thread
    // await user.sees(ChannelPreview(CHANNEL_NAME)).contains.lastMessage(ADDED_MESSAGE_THREAD);
  });
});

test.describe('receive the reply', () => {
  test.beforeEach(async ({ controller, page, user: user1 }) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await user1.clicks(ChannelPreview).text(CHANNEL_NAME);
    await controller.clearChannel();
    await controller.sendMessage();
    await user1.clicks(MessageActions).reply(ADDED_MESSAGE_MAIN_LIST);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user1.submits(MessageInput).reply(ADDED_MESSAGE_THREAD),
    ]);
    await controller.openStory('add-message--user2', selectors.channelPreviewButton);
  });

  // todo: channel preview does not reflect new messages from thread
  // test('for the other user channel preview displays correct last message showed unread', async ({user: user2}) => {
  //   await user2.sees(ChannelPreview(CHANNEL_NAME)).not.read();
  //   await user2.sees(ChannelPreview(CHANNEL_NAME)).contains.lastMessage(ADDED_MESSAGE_THREAD);
  // });

  test('the other user sees that reply to a message appeared at the bottom of the thread and in channel preview', async ({
    page,
    user: user2,
  }) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/read') && r.ok()),
      user2.clicks(ChannelPreview).text(CHANNEL_NAME),
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/replies') && r.ok()),
      user2.clicks(MessageActions).reply(ADDED_MESSAGE_MAIN_LIST),
    ]);

    await user2.sees(Thread).not.empty();
    await user2.sees(ChannelPreview)(CHANNEL_NAME).read();
    await user2.sees(Thread).inViewport.nthMessage(ADDED_MESSAGE_THREAD, -1);
  });
});
