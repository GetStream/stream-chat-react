// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Event} ChannelDeletedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelDeletedEvent) => void} [customHandler]
 */
export const useChannelDeletedListener = (setChannels, customHandler) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    /** @param {import('stream-chat').Event} e */
    const handleEvent = (e) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      } else {
        setChannels((channels) => {
          const channelIndex = channels.findIndex(
            (channel) => channel.cid === e?.cid,
          );

          if (channelIndex < 0) return [...channels];

          // Remove the deleted channel from the list.s
          channels.splice(channelIndex, 1);

          // eslint-disable-next-line consistent-return
          return [...channels];
        });
      }
    };

    client.on('channel.deleted', handleEvent);

    return () => {
      client.off('channel.deleted', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
