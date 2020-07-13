// @ts-check

import { useEffect, useContext } from 'react';
import uniqBy from 'lodash.uniqby';
import { ChatContext } from '../../../context';
import { getChannel } from '../utils';

/**
 * @typedef {import('stream-chat').Event<string>} NotificationAddedToChannelEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: NotificationAddedToChannelEvent) => void} [customHandler]
 */
export const useNotificationMessageNewListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = async (e) => {
      // if new message, put move channel up
      // get channel if not in state currently
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else if (e.channel?.type) {
        const channel = await getChannel(client, e.channel.type, e.channel.id);
        // move channel to starting position
        setChannels((channels) => {
          return uniqBy([channel, ...channels], 'cid');
        });
      }
    };

    client.on('notification.message_new', handleEvent);

    return () => {
      client.off('notification.message_new', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
