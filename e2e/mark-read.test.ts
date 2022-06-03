/* eslint-disable jest/expect-expect */
/* eslint-disable jest/no-done-callback */
/* eslint-disable jest/require-top-level-describe */
import { test } from './user/test';
import selectors from './user/selectors';

import ChannelPreview from './user/components/ChannelPreview';

const onPageLoadWaitForSelector = selectors.channelPreviewButton;

test.describe('mark read', () => {
  test.beforeEach(async ({ controller, page, user: user1 }) => {
    await controller.openStory('mark-read--user1', onPageLoadWaitForSelector);

    const channelListItems = page.locator(`${selectors.channelList} > *`);
    const listCount = await channelListItems.count();

    for (let i = 1; i <= listCount; ++i) {
      await Promise.all([
        page.waitForSelector(`${selectors.channelHeader} >> text=mr-channel-${i}`),
        user1.clicks(ChannelPreview).text(`mr-channel-${i}`),
      ]);
      await controller.clearChannel();
      await controller.sendMessage();
    }

    await controller.openStory('mark-read--user2', onPageLoadWaitForSelector);
  });

  test('unread count in "mr-channel-1" channel is 1', async ({ user: user2 }) => {
    await user2.sees(ChannelPreview)('mr-channel-1').not.read();
  });

  test('unread count changes to 0 after setting "mr-channel-1" channel as active', async ({
    user: user2,
  }) => {
    await user2.clicks(ChannelPreview).text(`mr-channel-1`);
    await user2.sees(ChannelPreview)('mr-channel-1').read();
  });

  test('unread count stays 0 after switching channels', async ({ user: user2 }) => {
    await user2.clicks(ChannelPreview).text(`mr-channel-1`);
    await user2.clicks(ChannelPreview).text(`mr-channel-2`);

    await user2.sees(ChannelPreview)('mr-channel-1').read();
    await user2.sees(ChannelPreview)('mr-channel-2').read();
  });

  test('unread count stays 0 after switching channels and reloading page', async ({
    controller,
    page,
    user: user2,
  }) => {
    await Promise.all([
      page.waitForSelector('.str-chat__main-panel >> text=mr-channel-1'),
      user2.clicks(ChannelPreview).text(`mr-channel-1`),
    ]);

    await Promise.all([
      page.waitForResponse((r) => r.url().includes('/mr-channel-2/read') && r.ok()),
      user2.clicks(ChannelPreview).text(`mr-channel-2`),
    ]);

    await controller.reloadPage(onPageLoadWaitForSelector);
    await user2.sees(ChannelPreview)('mr-channel-2').read();
  });
});
