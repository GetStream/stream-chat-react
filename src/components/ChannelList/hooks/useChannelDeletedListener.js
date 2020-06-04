import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useChannelDeletedListener = (setChannels, customHandler) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels((channels) => {
          const channelIndex = channels.findIndex(
            (channel) => channel.cid === e.channel.cid,
          );

          if (channelIndex < 0) return;

          // Remove the deleted channel from the list.s
          channels.splice(channelIndex, 1);

          // eslint-disable-next-line consistent-return
          return [...channels];
        });
      }
    };

    client.on('channel.deleted', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('channel.deleted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
