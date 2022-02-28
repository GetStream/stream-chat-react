import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useMessageNewListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setChannels((channels) => {
        const channelInList = channels.filter((channel) => channel.cid === event.cid).length > 0;

        if (!channelInList && allowNewMessagesFromUnfilteredChannels && event.channel_type) {
          const channel = client.channel(event.channel_type, event.channel_id);
          return uniqBy([channel, ...channels], 'cid');
        }

        if (!lockChannelOrder) return moveChannelUp({ channels, cid: event.cid || '' });

        return channels;
      });
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [lockChannelOrder]);
};
