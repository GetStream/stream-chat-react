import type { Channel, MembersState } from 'stream-chat';

import { useStateStore } from '../store';

const memberCountSelector = (nextValue: MembersState) => ({
  activeMemberCount: nextValue.activeMemberCount,
  memberCount: nextValue.memberCount,
});

export const useDisplayedMemberCount = (channel: Channel) => {
  const { activeMemberCount, memberCount } = useStateStore(
    channel.state,
    memberCountSelector,
  );

  const displayedMemberCount = activeMemberCount ?? memberCount;

  return displayedMemberCount;
};
