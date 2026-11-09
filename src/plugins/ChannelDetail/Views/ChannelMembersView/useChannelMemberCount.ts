import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

// Channel events that may change `member_count`, which the SDK refreshes in `channel.data`.
// Re-reading it on these events needs no count bookkeeping in the views that change membership.
const MEMBER_COUNT_EVENTS = [
  'member.added',
  'member.removed',
  'channel.updated',
] as const;

/** Reactive channel member count. */
export const useChannelMemberCount = (channel: Channel) => {
  const [memberCount, setMemberCount] = useState(channel.data?.member_count ?? 0);

  useEffect(() => {
    const syncMemberCount = () => setMemberCount(channel.data?.member_count ?? 0);

    syncMemberCount();

    const subscriptions = MEMBER_COUNT_EVENTS.map((event) =>
      channel.on(event, syncMemberCount),
    );

    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [channel]);

  return memberCount;
};
