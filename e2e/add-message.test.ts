/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { selectors } from './user/Controller';
import { test } from './user/test';


test.describe('add text message', () => {

  test.beforeEach(async ({controller}) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await controller.activateChannel();
  });

  test('message list and preview button should be clear', async ({controller, user}) => {
    await controller.clearChannel()

    await user.sees.MessageList.empty();
    await user.sees.ChannelPreview.empty();
  });

  test('message list should update for current user', async ({controller, user}) => {
    await controller.sendMessage();

    await user.sees.MessageList.not.empty();
    await user.sees.MessageList.contains.message('Hello world!');
    await user.sees.ChannelPreview.contains.message('Hello world!');
  });
});

test.describe('receive a message', () => {

  test.beforeEach(async ({controller}) => {
    await controller.openStory('add-message--user1', selectors.channelPreviewButton);
    await controller.activateChannel();

    await controller.sendMessage();

    await controller.openStory('add-message--user2', selectors.channelPreviewButton);
  });

  test('channel list should update for channel members and show unread', async ({user}) => {
    await user.sees.ChannelPreview.not.read();
    await user.sees.ChannelPreview.contains.message('Hello world!');
  });

  test('message list should update for different users on the channel', async ({controller, user}) => {
    await controller.markChannelReadByClickingChannelPreview();

    await user.sees.MessageList.not.empty();
    await user.sees.ChannelPreview.read();
    await user.sees.MessageList.contains.message('Hello world!');
  });
});
