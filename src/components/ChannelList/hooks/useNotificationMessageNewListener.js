import { useEffect, useContext } from 'react';
import uniqBy from 'lodash.uniqby';
import { ChatContext } from '../../../context';
import { getChannel } from '../utils';

export const useNotificationMessageNewListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = async (e) => {
      // if new message, put move channel up
      // get channel if not in state currently
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
        return;
      }

      const channel = await getChannel(client, e.channel.type, e.channel.id);
      // move channel to starting position
      setChannels((channels) => {
        return uniqBy([channel, ...channels], 'cid');
      });
    };

    client.on('notification.message_new', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('notification.message_new');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
