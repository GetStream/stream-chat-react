import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

// Channel events that change (or may change) the member count. `channel.data` is
// refreshed by the SDK on member add/remove and channel updates, so re-reading
// `member_count` on these events keeps the value in sync with real state — no
// imperative count bookkeeping from the views that mutate membership.
const MEMBER_COUNT_EVENTS = [
  'member.added',
  'member.removed',
  'channel.updated',
] as const;

/** Reactive channel member count derived from real channel state. */
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
