import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from 'stream-chat';
import type { Channel, StreamChat, UserResponse, WatcherState } from 'stream-chat';

import { ChannelInstanceProvider, ChatProvider } from '../../../../context';
import { mockChatContext } from '../../../../mock-builders';
import { useChannelHasMembersOnline } from '../useChannelHasMembersOnline';

// MERGE-RECONCILE (test migration): PR #2909 reworked useChannelHasMembersOnline from manual
// `channel.on('user.watching.start/stop')` tracking (via the deleted ChannelStateContext) to a
// reactive `channel.state.watcherStore` subscription (through useChannel). The test provides a
// channel with a real StateStore watcherStore and asserts the "exclude the current user" logic
// and reactivity to store changes.

const makeChannel = (watchers: Record<string, UserResponse> = {}) => {
  const watcherStore = new StateStore<WatcherState>({
    watcherCount: Object.keys(watchers).length,
    watchers,
  });
  const channel = fromPartial<Channel>({ state: { watcherStore } });
  return { channel, watcherStore };
};

const setWatchers = (
  watcherStore: StateStore<WatcherState>,
  watchers: Record<string, UserResponse>,
) =>
  act(() =>
    watcherStore.partialNext({
      watcherCount: Object.keys(watchers).length,
      watchers,
    }),
  );

const renderForChannel = (
  channel: Channel,
  params?: Parameters<typeof useChannelHasMembersOnline>[0],
) => {
  const client = fromPartial<StreamChat>({ user: { id: 'me' } });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>{children}</ChannelInstanceProvider>
    </ChatProvider>
  );
  return renderHook(() => useChannelHasMembersOnline(params), { wrapper });
};

describe('useChannelHasMembersOnline', () => {
  it('does not count the current user already in the watcher set', () => {
    const { channel } = makeChannel({ me: fromPartial<UserResponse>({ id: 'me' }) });

    const { result } = renderForChannel(channel);

    expect(result.current).toBe(false);
  });

  it('returns true when another user is watching', () => {
    const { channel } = makeChannel({
      me: fromPartial<UserResponse>({ id: 'me' }),
      other: fromPartial<UserResponse>({ id: 'other' }),
    });

    const { result } = renderForChannel(channel);

    expect(result.current).toBe(true);
  });

  it('reactively reflects watcherStore changes', () => {
    const { channel, watcherStore } = makeChannel();

    const { result } = renderForChannel(channel);
    expect(result.current).toBe(false);

    setWatchers(watcherStore, { other: fromPartial<UserResponse>({ id: 'other' }) });
    expect(result.current).toBe(true);

    setWatchers(watcherStore, {});
    expect(result.current).toBe(false);
  });

  it('ignores the current user starting to watch', () => {
    const { channel, watcherStore } = makeChannel();

    const { result } = renderForChannel(channel);
    setWatchers(watcherStore, { me: fromPartial<UserResponse>({ id: 'me' }) });

    expect(result.current).toBe(false);
  });

  it('returns false when disabled, even with other watchers', () => {
    const { channel } = makeChannel({
      other: fromPartial<UserResponse>({ id: 'other' }),
    });

    const { result } = renderForChannel(channel, { enabled: false });

    expect(result.current).toBe(false);
  });
});
