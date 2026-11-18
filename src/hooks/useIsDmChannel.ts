import type { Channel, ChannelStateData } from 'stream-chat';

import { useResolvedChannel } from '../context/useContextChannel';
import { useStateStore } from '../store';
import { isDmChannel } from '../utils';
import { getChannelOwnUserId } from '../utils/getChannelOwnUserId';

export type UseIsDmChannelParams = {
  channel?: Channel;
};

// Disposal and the membership change who the current user is (see `getChannelOwnUserId`).
const membersSelector = (nextValue: ChannelStateData) => ({
  memberCount: nextValue.memberCount,
  members: nextValue.members,
  membership: nextValue.membership,
  pendingDisposal: nextValue.pendingDisposal,
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
  // Subscribes so `isDmChannel` re-runs whenever the members change.
  useStateStore(channel.state, membersSelector);

  return isDmChannel({ channel, ownUserId: getChannelOwnUserId(channel) });
};
