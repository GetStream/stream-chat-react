import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from 'stream-chat';
import type { Channel, ChannelState, MembersState, StreamChat } from 'stream-chat';

import { ChannelInstanceProvider, ChatProvider } from '../../context';
import { mockChatContext } from '../../mock-builders';
import { useIsDmChannel } from '../useIsDmChannel';

// useIsDmChannel subscribes to channel.state.membersStore for reactivity and delegates the
// actual check to the pure `isDmChannel` util (covered by its own test). These tests focus on
// the hook wiring: it returns the isDmChannel result for the context channel and recomputes when
// the membersStore emits.

const makeChannel = (memberCount: number, members: ChannelState['members'] = {}) => {
  const membersStore = new StateStore<MembersState>({ memberCount, members });
  const channel = fromPartial<Channel>({
    data: { member_count: memberCount },
    state: { members, membersStore },
  });
  return { channel, membersStore };
};

const renderForChannel = (channel: Channel) => {
  const client = fromPartial<StreamChat>({ user: { id: 'user-1' } });
  const wrapper = ({ children }: React.PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelInstanceProvider value={{ channel }}>{children}</ChannelInstanceProvider>
    </ChatProvider>
  );
  return renderHook(() => useIsDmChannel(), { wrapper });
};

describe('useIsDmChannel', () => {
  it('is true for a one-member channel', () => {
    const { channel } = makeChannel(1);

    const { result } = renderForChannel(channel);

    expect(result.current).toBe(true);
  });

  it('is true for a two-member channel that includes the current user', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' } },
      'user-2': { user: { id: 'user-2' } },
    });

    const { result } = renderForChannel(makeChannel(2, members).channel);

    expect(result.current).toBe(true);
  });

  it('is false for a two-member channel that does not include the current user', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-2': { user: { id: 'user-2' } },
      'user-3': { user: { id: 'user-3' } },
    });

    const { result } = renderForChannel(makeChannel(2, members).channel);

    expect(result.current).toBe(false);
  });

  it('is false for a group channel', () => {
    const { result } = renderForChannel(makeChannel(3).channel);

    expect(result.current).toBe(false);
  });

  it('recomputes reactively when the membersStore emits', () => {
    const { channel, membersStore } = makeChannel(3);

    const { result } = renderForChannel(channel);
    expect(result.current).toBe(false);

    // The channel becomes a DM; the membersStore emission triggers the recompute.
    if (channel.data) channel.data.member_count = 1;
    act(() => membersStore.partialNext({ memberCount: 1, members: {} }));

    expect(result.current).toBe(true);
  });
});
