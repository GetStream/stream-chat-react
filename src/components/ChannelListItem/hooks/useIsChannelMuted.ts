import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'stream-chat';

export const useIsChannelMuted = (channel: Channel) => {
  const { client } = useChatContext('useIsChannelMuted');

  const [muted, setMuted] = useState(channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => setMuted(channel.muteStatus());

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  return muted;
};
