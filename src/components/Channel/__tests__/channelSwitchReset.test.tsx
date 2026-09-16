// What survives a channel change and what does not.
//
// `Channel` used to key its whole subtree on the channel, so a switch destroyed everything below
// it -- including components with no per-channel state of their own. The reset now lives where the
// state does: each message list keys itself on the channel instance (scroll position and
// virtualization accounting describe the messages of one instance), while the channel subtree
// around it is re-rendered rather than rebuilt. These tests pin both halves.
//
// Companion file: channelInstanceAxis.test.tsx, for why the identity is the instance, not the cid.

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { Channel } from '../Channel';
import { CHANNEL_CONTAINER_ID } from '../constants';
import { Chat } from '../../Chat';
import { MessageList } from '../../MessageList';
import { initClientWithChannels } from '../../../mock-builders';

import type { Channel as ChannelType, StreamChat } from 'stream-chat';

const renderChannel = (client: StreamChat, channel: ChannelType) => (
  <Chat client={client}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </Chat>
);

const channelContainer = () => document.getElementById(CHANNEL_CONTAINER_ID);
// The list element, not the panel: the panel is rendered above the message list's key so the
// notification area it holds survives a switch, which makes it a poor witness to the rebuild. This
// one is inside the key, and it is what carries the scroll state the key exists to reset.
const messageListElement = () => document.querySelector('.str-chat__message-list');

const setupTwo = () =>
  initClientWithChannels({
    channelsData: [
      { channel: { id: 'channel-a', type: 'messaging' } },
      { channel: { id: 'channel-b', type: 'messaging' } },
    ],
  });

// `Channel` no longer rebuilds its subtree on a channel change. What the rebuild used to reset is
// now reset where the state lives: the message list keys itself on the channel instance, and the
// bootstrap flags are reset by the effect that owns them.
describe('switching channels', () => {
  it('does not rebuild the channel subtree', async () => {
    const {
      channels: [channelA, channelB],
      client,
    } = await setupTwo();

    const { rerender } = render(renderChannel(client, channelA));
    const containerBefore = channelContainer();

    rerender(renderChannel(client, channelB));

    expect(channelContainer()).toBe(containerBefore);
  });

  it('does rebuild the message list, so its scroll state does not carry over', async () => {
    const {
      channels: [channelA, channelB],
      client,
    } = await setupTwo();

    const { rerender } = render(renderChannel(client, channelA));
    const listBefore = messageListElement();

    rerender(renderChannel(client, channelB));

    expect(messageListElement()).not.toBe(listBefore);
  });

  it('keeps the message list intact when the same channel re-renders', async () => {
    const {
      channels: [channelA],
      client,
    } = await setupTwo();

    const { rerender } = render(renderChannel(client, channelA));
    const listBefore = messageListElement();

    rerender(renderChannel(client, channelA));

    expect(messageListElement()).toBe(listBefore);
  });

  it('rebuilds the message list for a replacement instance of the same channel', async () => {
    const {
      channels: [first],
      client,
    } = await setupTwo();
    delete client.activeChannels[first.cid];
    const second = client.channel('messaging', 'channel-a');

    const { rerender } = render(renderChannel(client, first));
    const listBefore = messageListElement();

    rerender(renderChannel(client, second));

    await waitFor(() => expect(messageListElement()).not.toBe(listBefore));
  });
});
