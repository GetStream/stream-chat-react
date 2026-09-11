// What survives a channel change and what does not.
//
// `Channel` used to key its whole subtree on the channel, so a switch destroyed everything below
// it -- including components with no per-channel state of their own. The reset now lives where the
// state does: each message list keys itself on the channel instance (scroll position and
// virtualization accounting describe the messages of one instance), while the channel subtree
// around it is re-rendered rather than rebuilt. These tests pin both halves, and that neither a
// spinner nor a failure from the previous channel can carry into the next one.
//
// Companion file: channelInstanceAxis.test.tsx, for why the identity is the instance, not the cid.

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { Channel } from '../Channel';
import { CHANNEL_CONTAINER_ID } from '../constants';
import { Chat } from '../../Chat';
import { WithComponents } from '../../../context/WithComponents';
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
const loadingChannel = () => document.querySelector('.str-chat__loading-channel');

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

// The two bootstrap flags used to be reset by the remount mounting fresh state. The effect that
// owns them clears them too, but only once its async body reaches the `else` branch -- a microtask
// later. These assertions are deliberately synchronous: they pin the render in between, which is
// where the previous channel's spinner or error would otherwise be shown.
describe('switching away from a channel that never finished loading', () => {
  it('does not show the previous channel spinner for even one render', async () => {
    const {
      channels: [ready],
      client,
    } = await setupTwo();
    const pending = client.channel('messaging', 'never-resolves');
    // A bootstrap that never settles, so `isBootstrapping` stays true while this channel shows.
    vi.spyOn(pending, 'watch').mockImplementation(() => new Promise(() => undefined));

    const { rerender } = render(renderChannel(client, pending));
    await waitFor(() => expect(loadingChannel()).toBeInTheDocument());

    rerender(renderChannel(client, ready));

    expect(loadingChannel()).not.toBeInTheDocument();
    expect(messageListPanel()).toBeInTheDocument();
  });

  it('does not show the previous channel failure for even one render', async () => {
    const {
      channels: [ready],
      client,
    } = await setupTwo();
    const failing = client.channel('messaging', 'fails-to-load');
    vi.spyOn(failing, 'watch').mockRejectedValue(new Error('nope'));

    const LoadingErrorIndicator = () => <div data-testid='bootstrap-error' />;

    const renderWithErrorIndicator = (channel: ChannelType) => (
      <Chat client={client}>
        <WithComponents overrides={{ LoadingErrorIndicator }}>
          <Channel channel={channel}>
            <MessageList />
          </Channel>
        </WithComponents>
      </Chat>
    );

    const { rerender } = render(renderWithErrorIndicator(failing));
    await waitFor(() =>
      expect(
        document.querySelector('[data-testid="bootstrap-error"]'),
      ).toBeInTheDocument(),
    );

    rerender(renderWithErrorIndicator(ready));

    expect(
      document.querySelector('[data-testid="bootstrap-error"]'),
    ).not.toBeInTheDocument();
    expect(messageListPanel()).toBeInTheDocument();
  });
});
