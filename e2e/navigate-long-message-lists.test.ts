import { v4 as uuid } from 'uuid';

import selectors from './user/selectors';
import { test } from './user/test';

const CHANNEL_NAME = 'navigate-long-message-lists' as const;

const PARENT_MESSAGE_TEXT = 'Message 149' as const;
const FIRST_REPLY_TEXT = 'Message 150' as const;

test.describe('thread autoscroll', () => {
  test.beforeEach(async ({controller, user, page}) => {
    await controller.openStory('navigate-long-message-lists--user1', selectors.channelPreviewButton);
    await user.clicks.ChannelPreview.text(CHANNEL_NAME);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/messages') && r.ok()),
      user.clicks.Thread.open('replies')
    ]);
  });

  test('only if I send a message and thread bottom is not visible', async ({ controller, user, page}) => {
    const addedReply = uuid();
    await user.sees.Thread.inViewport.nthMessage(PARENT_MESSAGE_TEXT);
    await user.sees.Thread.start();
    await page.screenshot({path:'screenshot.png'})
    await user.sees.Thread.inViewport.nthMessage(FIRST_REPLY_TEXT);
    await user.sees.Thread.not.inDOM.nthMessage(addedReply);
    await user.submits.MessageInput.reply(addedReply);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      user.sees.Thread.inViewport.nthMessage(addedReply)
    ]);
    await user.sees.Thread.not.inViewport.nthMessage(FIRST_REPLY_TEXT);
    await controller.deleteLastReply();
  });

  test('not if I receive a message and thread bottom is not visible', async ({user, controller, page}) => {
    const otherUserReplyText = 'Reply back';
    await user.sees.Thread.inViewport.nthMessage(FIRST_REPLY_TEXT);
    await user.sees.Thread.not.inDOM.nthMessage(otherUserReplyText);
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/message') && r.ok()),
      await controller.sendOtherUserReply()
    ]);
    await user.sees.Thread.not.inViewport.nthMessage(otherUserReplyText);
    await user.sees.Thread.inViewport.nthMessage(FIRST_REPLY_TEXT);
    await controller.deleteOtherUserLastReply();
  });
})
