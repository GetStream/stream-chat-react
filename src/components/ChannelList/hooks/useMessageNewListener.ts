import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { getChannel } from '../../../utils';

export const useMessageNewListener = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  channels: Array<Channel<StreamChatGenerics>>,
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>,
    event: Event<StreamChatGenerics>,
  ) => void,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useMessageNewListener');

  useEffect(() => {
    const handleEvent = async (event: Event<StreamChatGenerics>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        if (event.message?.parent_id) return;

        const channelInList = channels.filter((channel) => channel.cid === event.cid).length > 0;

        if (!channelInList && allowNewMessagesFromUnfilteredChannels && event.channel_type) {
          const channel = await getChannel({
            client,
            id: event.channel?.id,
            type: event.channel?.type,
          });

          setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
          return;
        }

        setChannels((channels) => {
          if (!lockChannelOrder) return moveChannelUp({ channels, cid: event.cid || '' });

          return channels;
        });
      }
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [lockChannelOrder, channels]);
};
