import React from 'react';
import { act, renderHook } from '@testing-library/react';
import type { Channel, Event, StreamChat } from 'stream-chat';

import { Chat } from '../../../Chat';
import {
  generateMember,
  generateUser,
  initClientWithChannels,
} from '../../../../mock-builders';
import { useChannelHasOtherMembersOnline } from '../useChannelHasOtherMembersOnline';

const ownUser = generateUser({ id: 'me', online: true });

const setupChannel = async ({
  otherOnline,
  otherWatching = false,
}: {
  otherOnline: boolean;
  otherWatching?: boolean;
}) => {
  const otherUser = generateUser({ id: 'other', online: otherOnline });
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({
    channelsData: [
      {
        members: [generateMember({ user: ownUser }), generateMember({ user: otherUser })],
      },
    ],
    customUser: ownUser,
  });
  // `initClientWithChannels` leaves the watchers out of the channel response.
  if (otherWatching) channel.state.watchers = { [otherUser.id]: otherUser };
  return { channel, client };
};

const renderForChannel = (
  client: StreamChat,
  channel: Channel,
  params: Parameters<typeof useChannelHasOtherMembersOnline>[0] = {},
) =>
  renderHook(() => useChannelHasOtherMembersOnline({ channel, ...params }), {
    wrapper: ({ children }: React.PropsWithChildren) => (
      <Chat client={client}>{children}</Chat>
    ),
  });

const dispatchPresence = (client: StreamChat, online: boolean) =>
  act(() => {
    client.dispatchEvent({
      type: 'user.presence.changed',
      user: { id: 'other', online },
    } as Event);
  });

describe('useChannelHasOtherMembersOnline', () => {
  it('does not count the current user, who is online', async () => {
    const { channel, client } = await setupChannel({ otherOnline: false });

    const { result } = renderForChannel(client, channel);

    expect(result.current).toBe(false);
  });

  it('is true when another member is online, without watching the channel', async () => {
    const { channel, client } = await setupChannel({ otherOnline: true });

    const { result } = renderForChannel(client, channel);

    expect(Object.keys(channel.state.watchers)).toEqual([]);
    expect(result.current).toBe(true);
  });

  it('counts a member who watches the channel, whose user.online was not updated', async () => {
    const { channel, client } = await setupChannel({
      otherOnline: false,
      otherWatching: true,
    });

    const { result } = renderForChannel(client, channel);

    expect(result.current).toBe(true);
  });

  it('follows user.watching.start and user.watching.stop without presence', async () => {
    const { channel, client } = await setupChannel({ otherOnline: false });

    const { result } = renderForChannel(client, channel);
    expect(result.current).toBe(false);

    for (const type of ['user.watching.start', 'user.watching.stop'] as const) {
      act(() => {
        client.dispatchEvent({
          channel_id: channel.id,
          channel_type: channel.type,
          cid: channel.cid,
          type,
          user: { id: 'other', online: false },
        } as Event);
      });
      expect(result.current).toBe(type === 'user.watching.start');
    }
  });

  it("leaves out the given channel's own user, not the user in Chat", async () => {
    const { channel } = await setupChannel({ otherOnline: false });
    const { client: chatClient } = await initClientWithChannels({
      customUser: { id: 'other' },
    });

    // The channel's own user "me" is online but not counted; "other" is offline.
    const { result } = renderForChannel(chatClient, channel);

    expect(result.current).toBe(false);
  });

  it('follows user.presence.changed', async () => {
    const { channel, client } = await setupChannel({ otherOnline: false });

    const { result } = renderForChannel(client, channel);
    expect(result.current).toBe(false);

    dispatchPresence(client, true);
    expect(result.current).toBe(true);

    dispatchPresence(client, false);
    expect(result.current).toBe(false);
  });

  it('returns false when disabled, even with another member online', async () => {
    const { channel, client } = await setupChannel({ otherOnline: true });

    const { result } = renderForChannel(client, channel, { enabled: false });

    expect(result.current).toBe(false);
  });
});
