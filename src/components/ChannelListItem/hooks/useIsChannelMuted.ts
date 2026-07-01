import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'stream-chat';

/**
 * `channel.muteStatus()` throws in two cases:
 * - the channel has not been initialized yet (i.e. `.watch()`/`.query()` has not
 *   resolved) - the ChannelList can briefly hold such channels, e.g. a
 *   `message.new` for a channel that has not been watched yet (#2474);
 * - the channel is disconnected (e.g. after `client.disconnectUser()`), in which
 *   case `channel.getClient()` throws even though the channel stays initialized
 *   (#2393 failure class).
 * Guard against both to avoid crashing the whole app.
 */
const getMuteStatus = (channel: Channel) =>
  channel.initialized && !channel.disconnected
    ? channel.muteStatus()
    : { createdAt: null, expiresAt: null, muted: false };

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext('useIsChannelMuted');

  const [muted, setMuted] = useState(() => getMuteStatus(channel));

  useEffect(() => {
    const handleEvent = () => {
      setMuted(getMuteStatus(channel));
    };

    return client.on('notification.channel_mutes_updated', handleEvent).unsubscribe;
  }, [channel, client]);

  return muted;
};
