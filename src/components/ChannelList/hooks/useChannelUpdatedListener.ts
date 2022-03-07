import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useChannelUpdatedListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useChannelUpdatedListener');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      setChannels((channels) => {
        const channelIndex = channels.findIndex((channel) => channel.cid === event.channel?.cid);

        if (channelIndex > -1 && event.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = {
            ...event.channel,
            hidden: event.channel?.hidden ?? newChannels[channelIndex].data?.hidden,
            own_capabilities:
              event.channel?.own_capabilities ?? newChannels[channelIndex].data?.own_capabilities,
          };

          return [...newChannels];
        }

        return channels;
      });
      if (forceUpdate) {
        forceUpdate();
      }
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
    };

    client.on('channel.updated', handleEvent);

    return () => {
      client.off('channel.updated', handleEvent);
    };
  }, [customHandler]);
};
