import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useChannelTruncatedListener = (
  setChannels,
  customHandler,
  forceUpdate,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = (e) => {
      setChannels((channels) => [...channels]);

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }
      forceUpdate();
    };

    client.on('channel.truncated', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('channel.truncated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
