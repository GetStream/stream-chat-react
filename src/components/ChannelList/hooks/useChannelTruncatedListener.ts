import { useEffect } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

export const useChannelTruncatedListener = (
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel>>>,
    event: Event,
  ) => void,
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext('useChannelTruncatedListener');

  useEffect(() => {
    const handleEvent = (event: Event) => {
      setChannels((channels) => [...channels]);

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
      if (forceUpdate) {
        forceUpdate();
      }
    };

    client.on('channel.truncated', handleEvent);

    return () => {
      client.off('channel.truncated', handleEvent);
    };
  }, [client, customHandler, forceUpdate, setChannels]);
};
