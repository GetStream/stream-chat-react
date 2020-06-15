import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useNotificationRemovedFromChannelListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels((channels) =>
          channels.filter((channel) => channel.cid !== e.channel.cid),
        );
      }
    };

    client.on('notification.removed_from_channel', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('notification.removed_from_channel');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
