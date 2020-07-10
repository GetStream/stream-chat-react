// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Event<string>} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */
export const useNotificationRemovedFromChannelListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels((channels) =>
          channels.filter((channel) => channel.cid !== e.channel?.cid),
        );
      }
    };

    client.on('notification.removed_from_channel', handleEvent);

    return () => {
      client.off('notification.removed_from_channel', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
