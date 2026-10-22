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
  const hook = renderHook(() => useTypingUsers(channel, parentId), {
    wrapper: ({ children }) => (
      <ChatProvider value={fromPartial({ client })}>{children}</ChatProvider>
    ),
  });
  const setTyping = (typing: Record<string, unknown>) =>
    act(() => {
      channel.state.typing = typing as typeof channel.state.typing;
    });
  return { channel, client, hook, setTyping };
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
});
