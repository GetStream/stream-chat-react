import { useMemo } from 'react';
import type { Channel, MembersState } from 'stream-chat';

import { useStateStore } from '../../../../store';
import { getMemberUserIds } from './ChannelMembersView.utils';

const MEMBER_IDS_SEPARATOR = '\n';

// `members` is replaced on every presence update, but the joined IDs (which contain no line
// breaks) change only when a member joins or leaves.
const memberIdsKeySelector = ({ members }: MembersState) => ({
  memberIdsKey: getMemberUserIds(members).join(MEMBER_IDS_SEPARATOR),
});

/** Reactive list of channel member user IDs, from `channel.state`. */
export const useChannelMemberIds = (channel: Channel) => {
  const { memberIdsKey } = useStateStore(channel.state, memberIdsKeySelector);

  return useMemo(
    () => (memberIdsKey ? memberIdsKey.split(MEMBER_IDS_SEPARATOR) : []),
    [memberIdsKey],
  );
};
