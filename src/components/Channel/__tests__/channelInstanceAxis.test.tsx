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
import { getChannelInstanceKey } from '../channelInstanceKey';
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

    // Dropping the cache entry is how a genuinely new object for the same cid appears -- the same
    // thing `disconnectUser` does to every channel.
    delete client.activeChannels[first.cid];
    const second = client.channel('messaging', 'channel-a');

    return { client, first, second };
  };

  it('is a different object with the same cid', async () => {
    const { first, second } = await setup();

    expect(second).not.toBe(first);
    expect(second.cid).toBe(first.cid);
  });

  it('receives the channel event subscription', async () => {
    const { client, first, second } = await setup();
    const onSecond = vi.spyOn(second, 'on');
    const offFirst = vi.spyOn(first, 'off');

    const { rerender } = render(renderChannel(client, first));
    rerender(renderChannel(client, second));

    // The subscription is registered after the channel has been queried, so it lands a tick later.
    await waitFor(() => expect(onSecond).toHaveBeenCalled());
    expect(offFirst).toHaveBeenCalled();
  });

  it('is activated, and the previous instance released', async () => {
    const { client, first, second } = await setup();
    const activateSecond = vi.spyOn(second, 'activate');
    const deactivateFirst = vi.spyOn(first, 'deactivate');

    const { rerender } = render(renderChannel(client, first));
    rerender(renderChannel(client, second));

    await waitFor(() => expect(activateSecond).toHaveBeenCalled());
    expect(deactivateFirst).toHaveBeenCalled();
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
    const deactivate = vi.spyOn(channel, 'deactivate');

    const { rerender } = render(renderChannel(client, channel));
    await waitFor(() => expect(activate).toHaveBeenCalledTimes(1));

    rerender(renderChannel(client, channel));

    // A remount would release the channel and claim it again; the same instance keeps the same key.
    expect(deactivate).not.toHaveBeenCalled();
    expect(activate).toHaveBeenCalledTimes(1);
  });
});

describe('getChannelInstanceKey', () => {
  it('is stable for one instance and distinct per instance', async () => {
    const {
      channels: [first],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: { id: 'channel-a', type: 'messaging' } }],
    });
    delete client.activeChannels[first.cid];
    const second = client.channel('messaging', 'channel-a');

    expect(getChannelInstanceKey(first)).toBe(getChannelInstanceKey(first));
    expect(getChannelInstanceKey(second)).not.toBe(getChannelInstanceKey(first));
    // Readable in DevTools without being the identity.
    expect(getChannelInstanceKey(first).startsWith(`${first.cid}#`)).toBe(true);
  });
});
