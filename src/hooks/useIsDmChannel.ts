import type { Channel, MembersState } from 'stream-chat';

import { useChatContext } from '../context';
import { useResolvedChannel } from '../context/useContextChannel';
import { useStateStore } from '../store';
import { isDmChannel } from '../utils';
import { getChannelOwnUserId } from '../utils/getChannelOwnUserId';

export type UseIsDmChannelParams = {
  channel?: Channel;
};

const membersSelector = (nextValue: MembersState) => ({
  memberCount: nextValue.memberCount,
  members: nextValue.members,
});

/**
 * Reactively determines whether a channel is a direct-messaging channel, recomputing when its
 * members change.
 *
 * @param params.channel - Channel to check. Defaults to the channel from context.
 * @returns Whether the channel is a direct-messaging channel.
 */
export const useIsDmChannel = ({
  channel: channelOverride,
}: UseIsDmChannelParams = {}) => {
  const channel = useResolvedChannel(channelOverride);
  const { client } = useChatContext();
  // Subscribes so `isDmChannel` re-runs whenever the members change.
  useStateStore(channel.state, membersSelector);

  return isDmChannel({ channel, ownUserId: getChannelOwnUserId(channel, client) });
};
