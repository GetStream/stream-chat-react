/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import selectors from './user/selectors';
import { test } from './user/test';

const CHANNEL_NAME = 'add-message' as const;

test.describe('add text message', () => {

  test.beforeEach(async ({controller, user}) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await user.clicks.ChannelPreview.text(CHANNEL_NAME);
  });

  test('message list and preview button should be clear', async ({controller, user}) => {
    await controller.clearChannel()
    await user.sees.MessageList.empty();
    await user.sees.ChannelPreview(CHANNEL_NAME).empty();
  });

  test('message list should update for current user', async ({controller, user}) => {
    await controller.sendMessage();

    await user.sees.MessageList.not.empty();
    await user.sees.MessageList.contains.nthMessage('Hello world!', 0);
    await user.sees.ChannelPreview(CHANNEL_NAME).contains.message('Hello world!');
  });
});

test.describe('receive a message', () => {

  test.beforeEach(async ({controller, user}) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);

    await user.clicks.ChannelPreview.text(CHANNEL_NAME);

    await controller.sendMessage();

    await controller.openStory('add-message--user2', selectors.channelPreviewButton);
  });

  test('channel list should update for channel members and show unread', async ({user}) => {
    await user.sees.ChannelPreview(CHANNEL_NAME).not.read();
    await user.sees.ChannelPreview(CHANNEL_NAME).contains.message('Hello world!');
  });

  test('message list should update for different users on the channel', async ({user, page}) => {
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/read') && r.ok()),
      user.clicks.ChannelPreview.text(CHANNEL_NAME)
    ]);
    await user.sees.MessageList.not.empty();
    await user.sees.ChannelPreview(CHANNEL_NAME).read();
    await user.sees.MessageList.contains.nthMessage('Hello world!', 0);
  });
});
