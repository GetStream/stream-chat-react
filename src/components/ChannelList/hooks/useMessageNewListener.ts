import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

export const useMessageNewListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext('useMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const channelInList =
            channels.filter((channel) => channel.cid === event.cid).length > 0;

          if (
            !channelInList &&
            allowNewMessagesFromUnfilteredChannels &&
            event.channel_type
          ) {
            const channel = client.channel(event.channel_type, event.channel_id);
            return uniqBy([channel, ...channels], 'cid');
          }

          if (!lockChannelOrder) return moveChannelUp({ channels, cid: event.cid || '' });

          return channels;
        });
      }
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [
    allowNewMessagesFromUnfilteredChannels,
    client,
    customHandler,
    lockChannelOrder,
    setChannels,
  ]);
};
