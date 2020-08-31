// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Event} ChannelUpdatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelUpdatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */
export const useChannelUpdatedListener = (
  setChannels,
  customHandler,
  forceUpdate,
) => {
  const { client } = useContext(ChatContext);

  useEffect(() => {
    /** @param {import('stream-chat').Event} e */
    const handleEvent = (e) => {
      setChannels((channels) => {
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === e.channel?.cid,
        );

        if (channelIndex > -1 && e.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = e.channel;
          return [...newChannels];
        }

        return channels;
      });
      if (forceUpdate) {
        forceUpdate();
      }
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }
    };

    client.on('channel.updated', handleEvent);

    return () => {
      client.off('channel.updated', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
