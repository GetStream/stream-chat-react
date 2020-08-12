// @ts-check

import { useEffect, useContext } from 'react';
import uniqBy from 'lodash.uniqby';
import { ChatContext } from '../../../context';
import { getChannel } from '../utils';

/**
 * @typedef {import('stream-chat').Event<string>} ChannelVisibleEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelVisibleEvent) => void} [customHandler]
 */
export const useChannelVisibleListener = (setChannels, customHandler) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = async (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else if (e?.type) {
        const channel = await getChannel(client, e.channel_type, e.channel_id);
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('channel.visible', handleEvent);

    return () => {
      client.off('channel.visible', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
