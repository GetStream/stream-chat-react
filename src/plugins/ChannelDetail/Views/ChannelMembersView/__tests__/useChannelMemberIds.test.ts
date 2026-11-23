import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelMemberResponse, ChannelState, Event } from 'stream-chat';

import {
  getTestClientWithUser,
  initClientWithChannels,
} from '../../../../../mock-builders';
import { useChannelMemberIds } from '../useChannelMemberIds';

describe('useChannelMemberIds', () => {
  let channel: Channel;

  beforeEach(async () => {
    const client = await getTestClientWithUser({ id: 'own-user' });
    channel = client.channel('messaging', 'members');
    channel.state.members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' }, user_id: 'user-1' },
    });
  });

  it('returns the user IDs of the channel state members', () => {
    const { result } = renderHook(() => useChannelMemberIds(channel));

    expect(result.current).toEqual(['user-1']);
  });

  it('updates when the channel state members change', () => {
    const { result } = renderHook(() => useChannelMemberIds(channel));

    act(() => {
      channel.state.members = {
        ...channel.state.members,
        'user-2': fromPartial<ChannelMemberResponse>({
          user: { id: 'user-2' },
          user_id: 'user-2',
        }),
      };
    });

    expect(result.current).toEqual(['user-1', 'user-2']);
  });

  it('keeps the same array while the members are unchanged', () => {
    const { rerender, result } = renderHook(() => useChannelMemberIds(channel));
    const firstIds = result.current;

    rerender();

    expect(result.current).toBe(firstIds);
  });

  it('keeps the same array when a member changes without joining or leaving', () => {
    const { result } = renderHook(() => useChannelMemberIds(channel));
    const firstIds = result.current;

    act(() => {
      channel.state.members = {
        'user-1': fromPartial<ChannelMemberResponse>({
          user: { id: 'user-1', online: true },
          user_id: 'user-1',
        }),
      };
    });

    expect(result.current).toBe(firstIds);
  });

  it('is empty without members', () => {
    channel.state.members = {};

    const { result } = renderHook(() => useChannelMemberIds(channel));

    expect(result.current).toEqual([]);
  });

  it('updates on a member.added event', async () => {
    const {
      channels: [watchedChannel],
      client,
    } = await initClientWithChannels({ customUser: { id: 'own-user' } });
    const { result } = renderHook(() => useChannelMemberIds(watchedChannel));

    act(() => {
      client.dispatchEvent({
        channel_id: watchedChannel.id,
        channel_type: watchedChannel.type,
        cid: watchedChannel.cid,
        member: { user: { id: 'user-2' }, user_id: 'user-2' },
        type: 'member.added',
      } as Event);
    });

    expect(result.current).toEqual(['own-user', 'user-2']);
  });
});
