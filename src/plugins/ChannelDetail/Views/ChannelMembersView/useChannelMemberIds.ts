import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

import { getChannelMemberUserIds } from './ChannelMembersView.utils';

// Channel events that add, remove or change a member. `channel.state.members` is
// kept in sync by the SDK on these events, so re-reading the member ids on each
// keeps the derived set reactive — no imperative bookkeeping from the views that
// mutate membership.
const MEMBER_IDS_EVENTS = ['member.added', 'member.removed', 'member.updated'] as const;

/** Reactive set of channel member user ids derived from real channel state. */
export const useChannelMemberIds = (channel: Channel) => {
  const [memberIds, setMemberIds] = useState(() => getChannelMemberUserIds(channel));

  useEffect(() => {
    const syncMemberIds = () => setMemberIds(getChannelMemberUserIds(channel));

    syncMemberIds();

    const subscriptions = MEMBER_IDS_EVENTS.map((event) =>
      channel.on(event, syncMemberIds),
    );

    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [channel]);

  return memberIds;
};
