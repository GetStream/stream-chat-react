import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Event } from 'stream-chat';

import { ChatContext } from '../../../../context/ChatContext';
import type { ChatContextValue } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateUser,
  getOrCreateChannelApi,
  getTestClientWithUser,
  useMockedApis,
} from '../../../../mock-builders';
import { useIsChannelMuted } from '../useIsChannelMuted';
import { convertDateToTimestamp } from '../../../../mock-builders';

const clientUser = generateUser({ id: 'current-user' });

const createWrapper = (client) =>
  function Wrapper({ children }) {
    return (
      <ChatContext.Provider value={fromPartial<ChatContextValue>({ client })}>
        {children}
      </ChatContext.Provider>
    );
  };

describe('useIsChannelMuted', () => {
  it('does not throw when the channel has not been initialized (watched) yet', async () => {
    const client = await getTestClientWithUser(clientUser);
    // A channel that was never watched/queried is not initialized; the imperative
    // channel.muteStatus() this hook used to call throws `_checkInitialized` on such a
    // channel and crashed the app when it was rendered in the ChannelList (issue #2474).
    // Reading the reactive `muteStatus` slice is safe instead.
    const channel = client.channel('messaging', 'never-watched-channel');

    expect(channel.initialized).toBe(false);

    const { result } = renderHook(() => useIsChannelMuted(channel), {
      wrapper: createWrapper(client),
    });

    expect(result.current.muted).toBe(false);
  });

  it('returns the channel mute status for an initialized channel', async () => {
    const client = await getTestClientWithUser(clientUser);
    const mockedChannel = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    const channel = client.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const { result } = renderHook(() => useIsChannelMuted(channel), {
      wrapper: createWrapper(client),
    });

    expect(result.current.muted).toBe(false);
  });

  it('does not throw when an initialized channel is pending disposal', async () => {
    const client = await getTestClientWithUser(clientUser);
    const mockedChannel = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    const channel = client.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    expect(channel.initialized).toBe(true);
    // Once the client is disconnected (e.g. client.disconnectUser()), the channel stays
    // initialized but is flagged pending disposal, and channel.getClient() throws on it —
    // which the imperative channel.muteStatus() went through, crashing the ChannelListItem
    // render (#2393 failure class). The reactive slice is readable regardless.
    channel.pendingDisposal = true;

    const { result } = renderHook(() => useIsChannelMuted(channel), {
      wrapper: createWrapper(client),
    });

    expect(result.current.muted).toBe(false);
  });

  it('reactively reflects a mute applied after render', async () => {
    const client = await getTestClientWithUser(clientUser);
    const mockedChannel = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    const channel = client.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    const { result } = renderHook(() => useIsChannelMuted(channel), {
      wrapper: createWrapper(client),
    });

    expect(result.current.muted).toBe(false);

    // The client fans `mutedChannels` out to each active channel's `muteStatus` slice, which is
    // what the hook subscribes to — no `client.on` listener of its own any more.
    act(() =>
      client.dispatchEvent(
        fromPartial<Event>({
          me: {
            ...client.user,
            channel_mutes: [
              {
                channel: { cid: channel.cid },
                created_at: convertDateToTimestamp('2020-05-26T07:11:57.968Z'),
              },
            ],
          },
          type: 'notification.channel_mutes_updated',
        }),
      ),
    );

    expect(result.current.muted).toBe(true);
  });
});
