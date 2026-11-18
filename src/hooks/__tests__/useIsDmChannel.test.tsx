import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type {
  Channel,
  ChannelMemberResponse,
  ChannelState,
  StreamChat,
} from 'stream-chat';

import { ChannelInstanceProvider, ChatProvider } from '../../context';
import {
  generateChannelState,
  getTestClientWithUser,
  mockChatContext,
} from '../../mock-builders';
import { useIsDmChannel } from '../useIsDmChannel';

// The `isDmChannel` util has its own tests. These cover the hook wiring: it returns that result
// for the context channel and recomputes when the members state emits.

const makeChannel = (
  memberCount: number,
  members: ChannelState['members'] = {},
  ownUserId = 'user-1',
) => {
  const state = generateChannelState({ memberCount, members });
  const channel = fromPartial<Channel>({
    data: { member_count: memberCount },
    getClient: () => fromPartial<StreamChat>({ user: { id: ownUserId } }),
    state,
  });
  return { channel, state };
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

  it('recomputes reactively when the members slice emits', () => {
    const { channel, state } = makeChannel(3);

    const { result } = renderForChannel(channel);
    expect(result.current).toBe(false);

    // The channel becomes a DM and the store emission triggers the recompute.
    if (channel.data) channel.data.member_count = 1;
    act(() => state.partialNext({ memberCount: 1, members: {} }));

    expect(result.current).toBe(true);
  });

  it('reads the given channel without a channel provider', () => {
    const client = fromPartial<StreamChat>({ user: { id: 'user-1' } });
    const { channel } = makeChannel(1);
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
    );

    const { result } = renderHook(() => useIsDmChannel({ channel }), { wrapper });

    expect(result.current).toBe(true);
  });

  it('reads the given channel instead of the context channel', () => {
    const client = fromPartial<StreamChat>({ user: { id: 'user-1' } });
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ChatProvider value={mockChatContext({ client })}>
        <ChannelInstanceProvider value={{ channel: makeChannel(3).channel }}>
          {children}
        </ChannelInstanceProvider>
      </ChatProvider>
    );

    const { result } = renderHook(
      () => useIsDmChannel({ channel: makeChannel(1).channel }),
      { wrapper },
    );

    expect(result.current).toBe(true);
  });

  it("reads the current user from the given channel's client", () => {
    const chatClient = fromPartial<StreamChat>({ user: { id: 'user-1' } });
    const members = fromPartial<ChannelState['members']>({
      'user-a': { user: { id: 'user-a' } },
      'user-b': { user: { id: 'user-b' } },
    });
    const { channel } = makeChannel(2, members, 'user-a');
    const wrapper = ({ children }: React.PropsWithChildren) => (
      <ChatProvider value={mockChatContext({ client: chatClient })}>
        {children}
      </ChatProvider>
    );

    const { result } = renderHook(() => useIsDmChannel({ channel }), { wrapper });

    expect(result.current).toBe(true);
  });

  describe('for a channel pending disposal, whose client throws', () => {
    const makeDisposedDm = (membership: Partial<ChannelMemberResponse> = {}) => {
      const members = fromPartial<ChannelState['members']>({
        'user-a': { user: { id: 'user-a' } },
        'user-b': { user: { id: 'user-b' } },
      });
      const state = generateChannelState({
        memberCount: 2,
        members,
        membership: fromPartial<ChannelMemberResponse>(membership),
      });
      return fromPartial<Channel>({
        data: { member_count: 2 },
        getClient: () => {
          throw new Error('pending disposal');
        },
        pendingDisposal: true,
        state,
      });
    };
    const wrapperFor = (chatUserId: string) => {
      const ChatWithUser = ({ children }: React.PropsWithChildren) => (
        <ChatProvider
          value={mockChatContext({
            client: fromPartial<StreamChat>({ user: { id: chatUserId } }),
          })}
        >
          {children}
        </ChatProvider>
      );
      return ChatWithUser;
    };

    // The Chat user is not a member, so only the membership can make this a DM.
    it.each([
      ['user', { user: { id: 'user-a' } }],
      ['user_id', { user_id: 'user-a' }],
    ])("reads the current user from the channel's own membership %s", (_, membership) => {
      const { result } = renderHook(
        () => useIsDmChannel({ channel: makeDisposedDm(membership) }),
        { wrapper: wrapperFor('user-outside') },
      );

      expect(result.current).toBe(true);
    });

    // The Chat user is a member, so reading it would make this look like their DM.
    it('does not fall back to the user in Chat without a membership', () => {
      const { result } = renderHook(() => useIsDmChannel({ channel: makeDisposedDm() }), {
        wrapper: wrapperFor('user-b'),
      });

      expect(result.current).toBe(false);
    });
  });

  it('recomputes when the channel enters disposal', async () => {
    const client = await getTestClientWithUser({ id: 'own-user' });
    const channel = client.channel('messaging', 'dm');
    channel.data = { member_count: 2 };
    channel.state.members = fromPartial<ChannelState['members']>({
      'other-user': { user: { id: 'other-user' } },
      'own-user': { user: { id: 'own-user' } },
    });

    const { result } = renderHook(() => useIsDmChannel({ channel }));
    expect(result.current).toBe(true);

    // Without a membership, a disposed channel no longer names its current user.
    act(() => channel.state.partialNext({ pendingDisposal: true }));

    expect(result.current).toBe(false);
  });
});
