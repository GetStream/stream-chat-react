import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelDeletedListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useChannelDeletedListener');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const channelIndex = channels.findIndex((channel) => channel.cid === event.cid);

          if (channelIndex < 0) return [...channels];

          // Remove the deleted channel from the list.s
          channels.splice(channelIndex, 1);

          return [...channels];
        });
      }
    };

    client.on('channel.deleted', handleEvent);

    return () => {
      client.off('channel.deleted', handleEvent);
    };
  }, [customHandler]);
};
