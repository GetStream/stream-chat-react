import type { Channel, MembersState } from 'stream-chat';

import { useChannel, useChatContext } from '../context';
import { useStateStore } from '../store';
import { isDmChannel } from '../utils';

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
  const contextChannel = useChannel();
  const channel = channelOverride ?? contextChannel;
  const { client } = useChatContext();
  // Subscribes so `isDmChannel` re-runs whenever the members change.
  useStateStore(channel.state, membersSelector);

  return isDmChannel({ channel, ownUserId: client.user?.id });
};
