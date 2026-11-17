import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from '@stream-io/state-store';
import type { Channel, ChannelConfig, ChannelStateData } from 'stream-chat';

import { ChatProvider } from '../../../../context/ChatContext';
import type { ChatContextValue } from '../../../../context/ChatContext';
import { useDisplayedTypingUsers } from '../useDisplayedTypingUsers';

const me = { id: 'me' };

// A channel whose typing state the test sets directly.
const createChannel = (cid: string) =>
  fromPartial<Channel>({
    cid,
    configState: new StateStore<ChannelConfig>(
      fromPartial<ChannelConfig>({ typingEvents: { enabled: true } }),
    ),
    state: new StateStore<ChannelStateData>(
      fromPartial<ChannelStateData>({ typing: {} }),
    ),
  });

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

const renderDisplayedTypingUsers = (channel: Channel, parentId?: string) =>
  renderHook(
    ({ channel, parentId }: { channel: Channel; parentId?: string }) =>
      useDisplayedTypingUsers(channel, parentId),
    {
      initialProps: { channel, parentId },
      wrapper: ({ children }) => (
        <ChatProvider value={fromPartial<ChatContextValue>({ client: { user: me } })}>
          {children}
        </ChatProvider>
      ),
    },
  );

const userIds = (entries: ReturnType<typeof useDisplayedTypingUsers>) =>
  entries.map((entry) => entry.user?.id);

describe('useDisplayedTypingUsers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the users typing now', () => {
    const channel = createChannel('messaging:a');
    const { result } = renderDisplayedTypingUsers(channel);

    setTyping(channel, { bob: typingIn('bob') });

    expect(userIds(result.current)).toEqual(['bob']);
  });

  it('keeps the last typing users for the hide delay after they stop', () => {
    const channel = createChannel('messaging:a');
    const { result } = renderDisplayedTypingUsers(channel);
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

  it('restarts the hide delay when typing stops again', () => {
    const channel = createChannel('messaging:a');
    const { result } = renderDisplayedTypingUsers(channel);
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

  it('does not keep typing users from the previous channel', () => {
    const channel = createChannel('messaging:a');
    const nextChannel = createChannel('messaging:b');
    const { rerender, result } = renderDisplayedTypingUsers(channel);
    setTyping(channel, { bob: typingIn('bob') });

    rerender({ channel: nextChannel, parentId: undefined });

    expect(result.current).toEqual([]);
  });

  it('does not show typing that stopped while another channel was open', () => {
    const channel = createChannel('messaging:a');
    const nextChannel = createChannel('messaging:b');
    const { rerender, result } = renderDisplayedTypingUsers(channel);
    setTyping(channel, { bob: typingIn('bob') });

    rerender({ channel: nextChannel, parentId: undefined });
    setTyping(channel, {});
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ channel, parentId: undefined });

    expect(result.current).toEqual([]);
  });

  it('returns the same empty list across renders while nobody is typing', () => {
    const channel = createChannel('messaging:a');
    const { rerender, result } = renderDisplayedTypingUsers(channel);
    const firstResult = result.current;

    rerender({ channel, parentId: undefined });

    expect(result.current).toBe(firstResult);
  });

  it('does not keep typing users from the previous thread', () => {
    const channel = createChannel('messaging:a');
    const { rerender, result } = renderDisplayedTypingUsers(channel, 'thread-1');
    setTyping(channel, { bob: typingIn('bob', 'thread-1') });
    expect(userIds(result.current)).toEqual(['bob']);

    rerender({ channel, parentId: 'thread-2' });

    expect(result.current).toEqual([]);
  });
});
