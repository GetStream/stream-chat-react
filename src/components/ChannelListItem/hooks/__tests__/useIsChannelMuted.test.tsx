import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

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
    // A channel that was never watched/queried is not initialized; calling
    // channel.muteStatus() on it throws `_checkInitialized` and crashes the app
    // when such a channel is rendered in the ChannelList (issue #2474).
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

  it('does not throw when an initialized channel has been disconnected', async () => {
    const client = await getTestClientWithUser(clientUser);
    const mockedChannel = generateChannel();
    useMockedApis(client, [getOrCreateChannelApi(mockedChannel)]);
    const channel = client.channel('messaging', mockedChannel.channel.id);
    await channel.watch();

    expect(channel.initialized).toBe(true);
    // Once the client is disconnected (e.g. client.disconnectUser()), the channel
    // stays initialized but channel.muteStatus() -> channel.getClient() throws
    // "You can't use a channel after client.disconnect() was called", crashing the
    // ChannelListItem render unless we guard against it (#2393 failure class).
    channel.disconnected = true;

    const { result } = renderHook(() => useIsChannelMuted(channel), {
      wrapper: createWrapper(client),
    });

    expect(result.current.muted).toBe(false);
  });
});
