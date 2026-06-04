import { useEffect, useState } from 'react';
import type { Channel, ChannelState } from 'stream-chat';

import { useChannelStateContext } from '../../../context/ChannelStateContext';

export type UseChannelHasMembersOnlineParams = {
  channel?: Channel;
  enabled?: boolean;
};

export const useChannelHasMembersOnline = ({
  channel: channelOverride,
  enabled = true,
}: UseChannelHasMembersOnlineParams = {}) => {
  const { channel: contextChannel } = useChannelStateContext();
  const channel = channelOverride ?? contextChannel;
  const [watchers, setWatchers] = useState<ChannelState['watchers']>(() =>
    Object.assign({}, channel?.state?.watchers ?? {}),
  );

  useEffect(() => {
    setWatchers(Object.assign({}, channel?.state?.watchers ?? {}));
  }, [channel]);

  useEffect(() => {
    if (!enabled || !channel) return;

    const startSubscription = channel.on('user.watching.start', (event) => {
      setWatchers((prev) => {
        if (!event.user?.id) return prev;
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
  }, [channel, enabled]);

  if (!enabled) return false;

  return Object.keys(watchers).length > 0;
};
