import type { Channel, ChannelWatchState } from 'stream-chat';

import { useChannel } from '../../../context';
import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

export type UseChannelHasMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

const watchersSelector = (nextValue: ChannelWatchState) => ({
  watchers: nextValue.watchers,
});

/**
 * Whether anyone but the current user is watching the channel. The current user is excluded: the
 * other participant of a DM would otherwise look online as soon as the local user starts watching.
 * `channel` defaults to the channel in context, and `enabled: false` returns false.
 */
export const useChannelHasMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasMembersOnlineParams = {}) => {
  const contextChannel = useChannel();
  const channel = channelOverride ?? contextChannel;
  const { client } = useChatContext();
  const { watchers } = useStateStore(channel.state, watchersSelector);

  if (!enabled) return false;

  const ownUserId = client.user?.id;
  return Object.keys(watchers).some((id) => id !== ownUserId);
};
