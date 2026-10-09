import { act, renderHook } from '@testing-library/react';

import { getTestClientWithUser } from '../../../../mock-builders';
import { useChannelMembersState } from '../useChannelMembersState';
import { useChannelMembershipState } from '../useChannelMembershipState';

const member = (id: string) => ({
  channel_role: 'channel_member',
  user: { id },
  user_id: id,
});

describe('channel member state hooks', () => {
  it('useChannelMembersState follows members applied without an event, such as a query response', async () => {
    const client = await getTestClientWithUser({ id: 'ann' });
    const channel = client.channelManager.ensure({ id: 'dm', type: 'messaging' });
    const { result } = renderHook(() => useChannelMembersState(channel));
    expect(result.current).toEqual({});

    act(() => {
      channel.state.partialNext({
        members: { ann: member('ann'), bob: member('bob') } as never,
      });
    });

    expect(Object.keys(result.current)).toEqual(['ann', 'bob']);
    expect(result.current.ann.channel_role).toBe('channel_member');
  });

  it('useChannelMembershipState follows the membership applied without an event', async () => {
    const client = await getTestClientWithUser({ id: 'ann' });
    const channel = client.channelManager.ensure({ id: 'dm', type: 'messaging' });
    const { result } = renderHook(() => useChannelMembershipState(channel));

    act(() => {
      channel.state.partialNext({ membership: member('ann') as never });
    });

    expect(result.current.channel_role).toBe('channel_member');
  });

  it('returns undefined without a channel', () => {
    expect(
      renderHook(() => useChannelMembersState(undefined)).result.current,
    ).toBeUndefined();
    expect(
      renderHook(() => useChannelMembershipState(undefined)).result.current,
    ).toBeUndefined();
  });
});
