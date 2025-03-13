import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

export const useNotificationRemovedFromChannelListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
) => {
  const { client } = useChatContext('useNotificationRemovedFromChannelListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) =>
          channels.filter((channel) => channel.cid !== event.channel?.cid),
        );
      }
    };

    client.on('notification.removed_from_channel', handleEvent);

    return () => {
      client.off('notification.removed_from_channel', handleEvent);
    };
  }, [client, customHandler, setChannels]);
};
