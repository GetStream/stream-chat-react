import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useIsChannelMuted = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useIsChannelMuted');

  const [muted, setMuted] = useState(channel.muteStatus());

  useEffect(() => {
    const handleEvent = () => setMuted(channel.muteStatus());

    client.on('notification.channel_mutes_updated', handleEvent);
    return () => client.off('notification.channel_mutes_updated', handleEvent);
  }, [muted]);

  return muted;
};
