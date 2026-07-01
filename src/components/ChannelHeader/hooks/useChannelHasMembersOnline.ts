import { useEffect, useState } from 'react';
import type { Channel, ChannelState } from 'stream-chat';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';

export type UseChannelHasMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

// Watchers include the current user, but "are other members online" must reflect
// only other users — otherwise (e.g. in a DM) the other participant looks online
// as soon as the local user starts watching.
const getOtherWatchers = (
  watchers: ChannelState['watchers'] | undefined,
  ownUserId?: string,
) => {
  const next = Object.assign({}, watchers ?? {});
  if (ownUserId) delete next[ownUserId];
  return next;
};

export const useChannelHasMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasMembersOnlineParams = {}) => {
  const { channel: contextChannel } = useChannelStateContext();
  const { client } = useChatContext();
  const channel = channelOverride ?? contextChannel;
  const ownUserId = client.user?.id;
  const [watchers, setWatchers] = useState<ChannelState['watchers']>(() =>
    getOtherWatchers(channel?.state?.watchers, ownUserId),
  );

  useEffect(() => {
    setWatchers(getOtherWatchers(channel?.state?.watchers, ownUserId));
  }, [channel, ownUserId]);

  useEffect(() => {
    if (!enabled || !channel) return;

    const startSubscription = channel.on('user.watching.start', (event) => {
      setWatchers((prev) => {
        if (!event.user?.id || event.user.id === ownUserId) return prev;
        if (prev[event.user.id]) return prev;
        return Object.assign({ [event.user.id]: event.user }, prev);
      });
    });
    const stopSubscription = channel.on('user.watching.stop', (event) => {
      setWatchers((prev) => {
        if (!event.user?.id || !prev[event.user.id]) return prev;

        const next = Object.assign({}, prev);
        delete next[event.user.id];
        return next;
      });
    });

    return () => {
      startSubscription.unsubscribe();
      stopSubscription.unsubscribe();
    };
  }, [channel, enabled, ownUserId]);

  if (!enabled) return false;

  return Object.keys(watchers).length > 0;
};
