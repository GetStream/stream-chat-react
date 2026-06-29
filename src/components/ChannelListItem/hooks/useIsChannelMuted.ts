import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'stream-chat';

/**
 * `channel.muteStatus()` throws when the channel has not been initialized yet
 * (i.e. `.watch()`/`.query()` has not resolved). The ChannelList can briefly
 * hold such channels - e.g. a `message.new` for a channel that has not been
 * watched yet - so guard against it to avoid crashing the whole app (#2474).
 */
const getMuteStatus = (channel: Channel) =>
  channel.initialized
    ? channel.muteStatus()
    : { createdAt: null, expiresAt: null, muted: false };

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext('useIsChannelMuted');

  const [muted, setMuted] = useState(() => getMuteStatus(channel));

  useEffect(() => {
    const handleEvent = () => setMuted(getMuteStatus(channel));

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return muted;
};
