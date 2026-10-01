// What "the channel" means to `Channel`: the Channel *instance*, never its `cid`.
//
// A `cid` names a conversation; it does not identify the object representing it. The client's cache
// holds one instance per cid at a time, but evicts entries on `channel.deleted`,
// `notification.removed_from_channel` and `disconnectUser` -- so a second object for the same cid
// is an ordinary occurrence, and anything bound to the old one is bound to something the client has
// stopped feeding. These tests pin that a replacement instance is subscribed and activated, and
// that re-rendering the same instance does neither again.
//
// Companion file: channelSwitchReset.test.tsx, for what is rebuilt and what survives on a switch.

import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { Channel } from '../Channel';
import { Chat } from '../../Chat';
import { MessageList } from '../../MessageList';
import { initClientWithChannels } from '../../../mock-builders';

import { Channel as StreamChannel } from 'stream-chat';
import type { Channel as ChannelType, StreamChat } from 'stream-chat';

const renderChannel = (client: StreamChat, channel: ChannelType) => (
  <Chat client={client}>
    <Channel channel={channel}>
      <MessageList />
    </Channel>
  </Chat>
);

// `cid` names a conversation; it does not identify the object representing it. Anything scoped to
// "the channel" has to follow the instance, or a replacement instance is left unwatched while its
// children have already rebound to it.
describe('a replacement Channel instance for the same cid', () => {
  const setup = async () => {
    const {
      channels: [first],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { id: 'channel-a', type: 'messaging' } }],
    });

    // A second object for the same cid. The client creates one after it drops the first (a deletion,
    // `disconnectUser`), which also tears the first down; built directly here, the first stays usable.
    const second = new StreamChannel(client, 'messaging', 'channel-a', {});

    return { client, first, second };
  };

  it('is a different object with the same cid', async () => {
    const { first, second } = await setup();

    expect(second).not.toBe(first);
    expect(second.cid).toBe(first.cid);
  });

  it('receives the channel event subscriptions', async () => {
    const { client, first, second } = await setup();
    const onSecond = vi.spyOn(second, 'on');
    const unsubscribeFirst = vi.fn();
    vi.spyOn(first, 'on').mockReturnValue({ unsubscribe: unsubscribeFirst });

    const { rerender } = render(renderChannel(client, first));
    rerender(renderChannel(client, second));

    await waitFor(() => expect(onSecond).toHaveBeenCalled());
    // The previous instance's subscriptions are released by their own handles.
    expect(unsubscribeFirst).toHaveBeenCalled();
  });

  it('is activated, and the previous instance released', async () => {
    const { client, first, second } = await setup();

    const { rerender } = render(renderChannel(client, first));
    await waitFor(() => expect(first.active).toBe(true));
    rerender(renderChannel(client, second));

    await waitFor(() => expect(second.active).toBe(true));
    expect(first.active).toBe(false);
  });
});

describe('the same Channel instance re-rendered', () => {
  it('is not torn down and set up again', async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { id: 'channel-a', type: 'messaging' } }],
    });
    const activate = vi.spyOn(channel, 'activate');

    const { rerender } = render(renderChannel(client, channel));
    await waitFor(() => expect(activate).toHaveBeenCalledTimes(1));

    rerender(renderChannel(client, channel));

    // A remount would release the channel and claim it again; the same instance keeps the same key.
    expect(activate).toHaveBeenCalledTimes(1);
    expect(channel.active).toBe(true);
  });
});
