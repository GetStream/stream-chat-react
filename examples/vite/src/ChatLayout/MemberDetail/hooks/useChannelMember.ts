import { useEffect, useState } from 'react';
import type { ChannelMemberResponse, Channel as StreamChannel } from 'stream-chat';

// The channel member with `userId`: the cached one, or, for a member not loaded yet (a large
// channel, say), the one fetched for it.
export const useChannelMember = (channel: StreamChannel, userId: string) => {
  const [member, setMember] = useState<ChannelMemberResponse | undefined>(
    () => channel.state.members[userId],
  );

  useEffect(() => {
    const existing = channel.state.members[userId];
    if (existing) {
      setMember(existing);
      return;
    }
    let cancelled = false;
    channel
      .queryMembers({ payload: { filter_conditions: { id: { $in: [userId] } } } })
      .then((response) => {
        if (!cancelled) setMember(response.members[0]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [channel, userId]);

  return member;
};
