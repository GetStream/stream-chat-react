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
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from '../../MessageList/MessageListMainPanel';
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
const messageListPanel = () =>
  document.querySelector(`.${MESSAGE_LIST_MAIN_PANEL_CLASS.split(' ').join('.')}`);

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
    const panelBefore = messageListPanel();

    rerender(renderChannel(client, channelB));

    expect(messageListPanel()).not.toBe(panelBefore);
  });

  it('keeps the message list intact when the same channel re-renders', async () => {
    const {
      channels: [channelA],
      client,
    } = await setupTwo();

    const { rerender } = render(renderChannel(client, channelA));
    const panelBefore = messageListPanel();

    rerender(renderChannel(client, channelA));

    expect(messageListPanel()).toBe(panelBefore);
  });

  it('rebuilds the message list for a replacement instance of the same channel', async () => {
    const {
      channels: [first],
      client,
    } = await setupTwo();
    delete client.activeChannels[first.cid];
    const second = client.channel('messaging', 'channel-a');

    const { rerender } = render(renderChannel(client, first));
    const panelBefore = messageListPanel();

    rerender(renderChannel(client, second));

    await waitFor(() => expect(messageListPanel()).not.toBe(panelBefore));
  });
});
