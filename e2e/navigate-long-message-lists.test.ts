import { expect } from '@playwright/test';
import selectors from './user/selectors';
import { test } from './user/test';

const CHANNEL_NAME = 'navigate-long-message-lists' as const;
const ADDED_REPLY = 'Added text' as const;


test.describe('thread autoscroll', () => {
  test.afterEach(async ({controller}) => {
    await controller.deleteLastReply();
  });

  test('only if I send a message and thread bottom is not visible', async ({controller, user, page}) => {
    await controller.openStory('navigate-long-message-lists--user1', selectors.channelPreviewButton)
    await user.clicks.ChannelPreview.text(CHANNEL_NAME);
    await user.clicks.Thread.open('replies');
    await user.sees.Thread.contains.nthMessage('Message 149');
    await user.sees.Thread.start();
    await user.sees.Thread.contains.nthMessage('Message 0');
    await user.sees.Thread.not.contains.nthMessage(ADDED_REPLY);
    await user.submits.MessageInput.reply(ADDED_REPLY);
    await user.sees.Thread.contains.nthMessage(ADDED_REPLY);
    const threadMessageList = await page.evaluate(() => {
      return document.querySelector('.str-chat__thread-list');
    });
    expect(threadMessageList?.scrollTop).toBe(threadMessageList?.getBoundingClientRect().height)
  });

  // todo: design a story receives message from another user while watching the screen
  // test('not if I receive a message and thread bottom is not visible', async () => {
  //
  // });
})
