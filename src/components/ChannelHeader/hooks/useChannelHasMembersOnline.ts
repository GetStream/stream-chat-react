import type { Channel, WatcherState } from 'stream-chat';

import { useChannel } from '../../../context';
import { useChatContext } from '../../../context/ChatContext';
import { useStateStore } from '../../../store';

export type UseChannelHasMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

const watchersSelector = (nextValue: WatcherState) => ({
  watchers: nextValue.watchers,
});

/**
 * Reactively reports whether OTHER members are currently online (watching the channel).
 *
 * Subscribes to the channel's `watcherStore` instead of manually tracking
 * `user.watching.start/stop` events. Watchers include the current user, but "are other
 * members online" must reflect only other users — otherwise (e.g. in a DM) the other
 * participant looks online as soon as the local user starts watching.
 */
export const useChannelHasMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasMembersOnlineParams = {}) => {
  const contextChannel = useChannel();
  const channel = channelOverride ?? contextChannel;
  const { client } = useChatContext();
  const { watchers } = useStateStore(channel.state.watcherStore, watchersSelector);

  if (!enabled) return false;

  const ownUserId = client.user?.id;
  return Object.keys(watchers).some((id) => id !== ownUserId);
};
