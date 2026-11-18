import type { Channel, ChannelStateData } from 'stream-chat';

import { useResolvedChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';
import { getChannelOwnUserId } from '../../../utils/getChannelOwnUserId';
import { getOnlineMembers } from './onlineMembers';

export type UseChannelHasOtherMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

const membersSelector = ({ members, watchers }: ChannelStateData) => ({
  members,
  watchers,
});

/**
 * Whether a member other than the current user is online (see `isMemberOnline`). `channel`
 * defaults to the channel in context, and `enabled: false` returns false.
 */
export const useChannelHasOtherMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasOtherMembersOnlineParams = {}) => {
  const channel = useResolvedChannel(channelOverride);
  const { members, watchers } = useStateStore(channel.state, membersSelector);

  if (!enabled) return false;

  const ownUserId = getChannelOwnUserId(channel);
  // Without the current user, no member can be told apart as another one.
  if (!ownUserId) return false;
  return getOnlineMembers({ members, watchers }).some(
    (member) => member.user?.id !== ownUserId,
  );
};
