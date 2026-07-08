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
 * Reactively determines whether a channel is a direct-messaging channel.
 *
 * Subscribes to the channel's `membersStore` so the result recomputes when membership
 * changes, then delegates the actual check to the `isDmChannel` util. Defaults to the
 * channel from context; pass `channel` to check a specific one.
 */
export const useIsDmChannel = ({
  channel: channelOverride,
}: UseIsDmChannelParams = {}) => {
  const contextChannel = useChannel();
  const channel = channelOverride ?? contextChannel;
  const { client } = useChatContext();
  // Subscribe for reactivity — re-run isDmChannel whenever membership changes.
  useStateStore(channel.state.membersStore, membersSelector);

  return isDmChannel({ channel, ownUserId: client.user?.id });
};
