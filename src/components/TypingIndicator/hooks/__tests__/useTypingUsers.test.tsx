import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelConfigWithInfo, StreamChat } from 'stream-chat';

import { ChatProvider } from '../../../../context/ChatContext';
import { initClientWithChannels } from '../../../../mock-builders';
import { useTypingUsers } from '../useTypingUsers';

const me = { id: 'me' };
const other = { id: 'other' };

const setTypingEvents = (client: StreamChat, channel: Channel, enabled: boolean) =>
  client.channelServerConfigsStore.partialNext({
    configs: {
      [channel.cid]: fromPartial<ChannelConfigWithInfo>({ typing_events: enabled }),
    },
  });

const renderTypingUsers = async (parentId?: string) => {
  const {
    channels: [channel],
    client,
  } = await initClientWithChannels({ customUser: me });
  setTypingEvents(client, channel, true);
  const renders = { count: 0 };
  const hook = renderHook(
    () => {
      renders.count += 1;
      return useTypingUsers(channel, parentId);
    },
    {
      wrapper: ({ children }) => (
        <ChatProvider value={fromPartial({ client })}>{children}</ChatProvider>
      ),
    },
  );
  const setTyping = (typing: Record<string, unknown>) =>
    act(() => {
      channel.state.typing = typing as typeof channel.state.typing;
    });
  return { channel, client, hook, renders, setTyping };
};

const typingUserIds = (entries: ReturnType<typeof useTypingUsers>) =>
  entries.map((entry) => entry.user?.id);

describe('useTypingUsers', () => {
  it("lists the other users typing in the channel's main list", async () => {
    const { hook, setTyping } = await renderTypingUsers();
    setTyping({
      inThread: { parent_id: 'thread-1', user: { id: 'in-thread' } },
      me: { user: me },
      other: { user: other },
    });

    expect(typingUserIds(hook.result.current)).toEqual(['other']);
  });

  it('lists the other users typing in the given thread', async () => {
    const { hook, setTyping } = await renderTypingUsers('thread-1');
    setTyping({
      inChannel: { user: { id: 'in-channel' } },
      inOtherThread: { parent_id: 'thread-2', user: { id: 'in-other-thread' } },
      me: { parent_id: 'thread-1', user: me },
      other: { parent_id: 'thread-1', user: other },
    });

    expect(typingUserIds(hook.result.current)).toEqual(['other']);
  });

  it('lists nobody while typing events are disabled for the channel', async () => {
    const { channel, client, hook, setTyping } = await renderTypingUsers();
    setTyping({ other: { user: other } });
    expect(typingUserIds(hook.result.current)).toEqual(['other']);

    act(() => setTypingEvents(client, channel, false));

    expect(hook.result.current).toEqual([]);
  });

  it('keeps one empty result while nobody else is typing', async () => {
    const { hook, setTyping } = await renderTypingUsers();
    const empty = hook.result.current;

    setTyping({ me: { user: me } });
    expect(hook.result.current).toBe(empty);

    setTyping({ inThread: { parent_id: 'thread-1', user: { id: 'in-thread' } } });
    expect(hook.result.current).toBe(empty);
  });

  it("does not re-render on the channel's typing while typing events are disabled", async () => {
    const { channel, client, hook, renders, setTyping } = await renderTypingUsers();
    act(() => setTypingEvents(client, channel, false));
    const empty = hook.result.current;
    const rendersWhileDisabled = renders.count;

    setTyping({ other: { user: other } });

    expect(renders.count).toBe(rendersWhileDisabled);
    expect(hook.result.current).toBe(empty);
  });

  it('lists the users typing again, and follows their changes, once typing events are enabled', async () => {
    const { channel, client, hook, setTyping } = await renderTypingUsers();
    act(() => setTypingEvents(client, channel, false));
    setTyping({ other: { user: other } });

    act(() => setTypingEvents(client, channel, true));
    expect(typingUserIds(hook.result.current)).toEqual(['other']);

    setTyping({ other: { user: other }, third: { user: { id: 'third' } } });
    expect(typingUserIds(hook.result.current)).toEqual(['other', 'third']);
  });

  it("does not subscribe to the channel's typing when typing events start disabled", async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({ customUser: me });
    setTypingEvents(client, channel, false);
    const subscribe = vi.spyOn(channel.state, 'subscribeWithSelector');

    const hook = renderHook(() => useTypingUsers(channel), {
      wrapper: ({ children }) => (
        <ChatProvider value={fromPartial({ client })}>{children}</ChatProvider>
      ),
    });

    expect(subscribe).not.toHaveBeenCalled();
    expect(hook.result.current).toEqual([]);
  });
});
