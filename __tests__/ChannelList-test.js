/**
 * STILL WORK IN PROGRESS
 */

/* eslint-disable sonarjs/no-unused-collection */
import React from 'react';
import { cleanup, render, wait } from '@testing-library/react';

import { ChannelList } from '../src/components/ChannelList';
import { ChannelPreviewMessenger } from '../src/components/ChannelPreviewMessenger';

import uuidv4 from 'uuid/v4';
import { getTestClient, createUserToken } from './utils';
import { ChannelListTeam } from '../src/components/ChannelListTeam';
import { Chat } from '../src/components/Chat';
import { act } from 'react-dom/test-utils';

// Note: running cleanup afterEach is done automatically for you in @testing-library/react@9.0.0 or higher
// unmount and cleanup DOM after the test is finished.
// eslint-disable-next-line no-undef
afterEach(cleanup);

describe('ChannelList', () => {
  let chatClient;
  let userId;
  let userToken;
  let channel;
  const channelIds = [];
  const channelNames = [];
  const channels = [];

  beforeAll(async function() {
    chatClient = getTestClient();
    userId = `thierry-${uuidv4()}`;
    userToken = createUserToken(userId);
    chatClient.setUser(
      {
        id: userId,
        name: 'Thierry',
        status: 'busy',
      },
      userToken,
    );

    // Generate multiple channels
    for (let i = 0; i < 10; i++) {
      const channelId = uuidv4();
      const channelName = uuidv4();
      channelIds.push(channelId);
      channelNames.push(channelName);
      channel = chatClient.channel('messaging', channelId, {
        name: channelName,
        members: [userId],
      });
      await channel.create();
      channels.push(channel);
    }
  });

  it('should render all channels in list', async () => {
    const { getByText, getByRole } = render(
      <Chat client={chatClient}>
        <ChannelList
          filters={{ members: { $in: [userId] } }}
          Preview={ChannelPreviewMessenger}
          List={ChannelListTeam}
        />
      </Chat>,
    );

    await wait(() => {
      getByRole('list');
    });
    channelNames.forEach((name) => {
      expect(getByText(name)).toBeTruthy();
    });
  });

  it('should move the channel with most recent message to top', async () => {
    const { getByText, getByRole, getAllByRole } = render(
      <Chat client={chatClient}>
        <ChannelList
          filters={{ members: { $in: [userId] } }}
          Preview={ChannelPreviewMessenger}
          List={ChannelListTeam}
          options={{ state: true, watch: true, presence: true }}
        />
      </Chat>,
    );

    await wait(() => {
      getByRole('list');
    });

    channelNames.forEach((name) => {
      expect(getByText(name)).toBeTruthy();
    });

    const newMessage = 'This is new';
    act(() => {
      chatClient.dispatchEvent({
        cid: channels[2].cid,
        type: 'message.new',
        message: {
          text: newMessage,
          user: {
            id: userId,
          },
        },
      });
    });

    await wait(() => {
      getByText(newMessage);
    });

    const items = getAllByRole('listitem');

    // Get the closes listitem to the channel that received new message.
    const channelPreview = getByText(channels[2].data.name).closest(
      '[role="listitem"]',
    );
    expect(channelPreview.isEqualNode(items[0])).toBeTruthy();
  });
});
