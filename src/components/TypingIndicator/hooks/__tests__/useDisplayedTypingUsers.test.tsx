import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type {
  Channel,
  ChannelConfigWithInfo,
  ChannelStateData,
  StreamChat,
} from 'stream-chat';

import { ChatProvider } from '../../../../context/ChatContext';
import type { ChatContextValue } from '../../../../context/ChatContext';
import { initClientWithChannels } from '../../../../mock-builders';
import { useDisplayedTypingUsers } from '../useDisplayedTypingUsers';

const me = { id: 'me' };

// Two watched channels with typing events enabled. Timers are faked only after the setup, which
// needs real ones.
const setup = async () => {
  const { channels, client } = await initClientWithChannels({
    channelsData: [{}, {}],
    customUser: me,
  });
  client.channelServerConfigsStore.partialNext({
    configs: Object.fromEntries(
      channels.map((channel) => [
        channel.cid,
        fromPartial<ChannelConfigWithInfo>({ typing_events: true }),
      ]),
    ),
  });
  vi.useFakeTimers();
  return { channel: channels[0], client, nextChannel: channels[1] };
};

const typingIn = (userId: string, parentId?: string) =>
  fromPartial<ChannelStateData['typing'][string]>({
    parent_id: parentId,
    type: 'typing.start',
    user: { id: userId },
  });

const setTyping = (channel: Channel, typing: ChannelStateData['typing']) =>
  act(() => {
    channel.state.partialNext({ typing });
  });

const renderDisplayedTypingUsers = (
  client: StreamChat,
  channel: Channel,
  parentId?: string,
) =>
  renderHook(
    ({ channel, parentId }: { channel: Channel; parentId?: string }) =>
      useDisplayedTypingUsers(channel, parentId),
    {
      initialProps: { channel, parentId },
      wrapper: ({ children }) => (
        <ChatProvider value={fromPartial<ChatContextValue>({ client })}>
          {children}
        </ChatProvider>
      ),
    },
  );

const userIds = (entries: ReturnType<typeof useDisplayedTypingUsers>) =>
  entries.map((entry) => entry.user?.id);

describe('useDisplayedTypingUsers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the users typing now', async () => {
    const { channel, client } = await setup();
    const { result } = renderDisplayedTypingUsers(client, channel);

    setTyping(channel, { bob: typingIn('bob') });

    expect(userIds(result.current)).toEqual(['bob']);
  });

  it('keeps the last typing users for the hide delay after they stop', async () => {
    const { channel, client } = await setup();
    const { result } = renderDisplayedTypingUsers(client, channel);
    setTyping(channel, { bob: typingIn('bob') });

    setTyping(channel, {});
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(userIds(result.current)).toEqual(['bob']);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual([]);
  });

  it('restarts the hide delay when typing stops again', async () => {
    const { channel, client } = await setup();
    const { result } = renderDisplayedTypingUsers(client, channel);
    setTyping(channel, { bob: typingIn('bob') });

    setTyping(channel, {});
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    setTyping(channel, { bob: typingIn('bob'), carol: typingIn('carol') });
    expect(userIds(result.current)).toEqual(['bob', 'carol']);
    setTyping(channel, {});
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(userIds(result.current)).toEqual(['bob', 'carol']);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual([]);
  });

  it('does not keep typing users from the previous channel', async () => {
    const { channel, client, nextChannel } = await setup();
    const { rerender, result } = renderDisplayedTypingUsers(client, channel);
    setTyping(channel, { bob: typingIn('bob') });

    rerender({ channel: nextChannel, parentId: undefined });

    expect(result.current).toEqual([]);
  });

  it('does not show typing that stopped while another channel was open', async () => {
    const { channel, client, nextChannel } = await setup();
    const { rerender, result } = renderDisplayedTypingUsers(client, channel);
    setTyping(channel, { bob: typingIn('bob') });

    rerender({ channel: nextChannel, parentId: undefined });
    setTyping(channel, {});
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ channel, parentId: undefined });

    expect(result.current).toEqual([]);
  });

  it('returns the same empty list across renders while nobody is typing', async () => {
    const { channel, client } = await setup();
    const { rerender, result } = renderDisplayedTypingUsers(client, channel);
    const firstResult = result.current;

    rerender({ channel, parentId: undefined });

    expect(result.current).toBe(firstResult);
  });

  it('does not keep typing users from the previous thread', async () => {
    const { channel, client } = await setup();
    const { rerender, result } = renderDisplayedTypingUsers(client, channel, 'thread-1');
    setTyping(channel, { bob: typingIn('bob', 'thread-1') });
    expect(userIds(result.current)).toEqual(['bob']);

    rerender({ channel, parentId: 'thread-2' });

    expect(result.current).toEqual([]);
  });

  it("returns the next channel's own entries when the same user types in both channels", async () => {
    const { channel, client, nextChannel } = await setup();
    const inNextChannel = typingIn('bob');
    setTyping(channel, { bob: typingIn('bob') });
    setTyping(nextChannel, { bob: inNextChannel });
    const { rerender, result } = renderDisplayedTypingUsers(client, channel);

    rerender({ channel: nextChannel, parentId: undefined });

    expect(result.current[0]).toBe(inNextChannel);
  });
});
