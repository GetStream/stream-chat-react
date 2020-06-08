import { useEffect, useContext } from 'react';
import Immutable from 'seamless-immutable';
import { ChatContext } from '../../../context';

export const useChannelUpdatedListener = (
  setChannels,
  customHandler,
  forceUpdate,
) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    const handleEvent = (e) => {
      setChannels((channels) => {
        const newChannels = channels;
        const channelIndex = newChannels.findIndex(
          (channel) => channel.cid === e.channel.cid,
        );

        if (channelIndex > -1) {
          newChannels[channelIndex].data = Immutable(e.channel);
          return [...newChannels];
        }

        return channels;
      });
      forceUpdate();
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }
    };

    client.on('channel.updated', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('channel.updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
