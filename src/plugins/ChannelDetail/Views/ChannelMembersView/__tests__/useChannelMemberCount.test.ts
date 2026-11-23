import { act, renderHook } from '@testing-library/react';
import type { Channel, Event } from 'stream-chat';

import {
  getTestClientWithUser,
  initClientWithChannels,
} from '../../../../../mock-builders';
import { useChannelMemberCount } from '../useChannelMemberCount';

describe('useChannelMemberCount', () => {
  let channel: Channel;

  beforeEach(async () => {
    const client = await getTestClientWithUser({ id: 'own-user' });
    channel = client.channel('messaging', 'members');
    channel.data = { member_count: 5 };
  });

  it('returns the member count from channel state', () => {
    const { result } = renderHook(() => useChannelMemberCount(channel));

    expect(result.current).toBe(5);
  });

  it('updates when the channel state member count changes', () => {
    const { result } = renderHook(() => useChannelMemberCount(channel));

    act(() => {
      channel.data = { ...channel.data, member_count: 3 };
    });

    expect(result.current).toBe(3);
  });

  it('updates on a channel.updated event', async () => {
    const {
      channels: [watchedChannel],
      client,
    } = await initClientWithChannels({ customUser: { id: 'own-user' } });
    const { result } = renderHook(() => useChannelMemberCount(watchedChannel));

    act(() => {
      client.dispatchEvent({
        channel: { ...watchedChannel.data, member_count: 4 },
        channel_id: watchedChannel.id,
        channel_type: watchedChannel.type,
        cid: watchedChannel.cid,
        type: 'channel.updated',
      } as Event);
    });

    expect(result.current).toBe(4);
  });
});
