import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

import { getChannelMemberUserIds } from './ChannelMembersView.utils';

// Channel events that add, remove or change a member; the SDK keeps `channel.state.members` in sync
// on them. Re-reading the IDs on each needs no bookkeeping in the views that change membership.
const MEMBER_IDS_EVENTS = ['member.added', 'member.removed', 'member.updated'] as const;

/** Reactive set of channel member user IDs. */
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
