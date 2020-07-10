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
export const useNotificationAddedToChannelListener = (
  setChannels,
  customHandler,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = async (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else if (e.channel?.type) {
        const channel = await getChannel(client, e.channel.type, e.channel.id);
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', handleEvent);

    return () => {
      client.off('notification.added_to_channel', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
