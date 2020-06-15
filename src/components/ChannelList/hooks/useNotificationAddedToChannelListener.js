import { useEffect, useContext } from 'react';
import uniqBy from 'lodash.uniqby';
import { ChatContext } from '../../../context';
import { getChannel } from '../utils';

export const useNotificationAddedToChannelListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = async (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        const channel = await getChannel(client, e.channel.type, e.channel.id);
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('notification.added_to_channel');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
