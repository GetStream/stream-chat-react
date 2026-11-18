import type { Channel, MembersState } from 'stream-chat';

import { useChatContext } from '../../../context/ChatContext';
import { useResolvedChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';
import { getOnlineMembers } from './onlineMembers';

export type UseChannelHasOtherMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

const membersSelector = ({ members }: MembersState) => ({ members });

/**
 * Whether a member other than the current user is online (`member.user.online`). `channel`
 * defaults to the channel in context, and `enabled: false` returns false.
 */
export const useChannelHasOtherMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasOtherMembersOnlineParams = {}) => {
  const channel = useResolvedChannel(channelOverride);
  const { client } = useChatContext();
  const { members } = useStateStore(channel.state, membersSelector);

  if (!enabled) return false;

  const ownUserId = client.user?.id;
  return getOnlineMembers(members).some((member) => member.user?.id !== ownUserId);
};
