// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Event<string>} ChannelTruncatedEvent
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {(setChannels: SetChannels, event: ChannelTruncatedEvent) => void} [customHandler]
 * @param {() => void} [forceUpdate]
 */
export const useChannelTruncatedListener = (
  setChannels,
  customHandler,
  forceUpdate,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = (e) => {
      setChannels((channels) => [...channels]);

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, e);
      }
      forceUpdate?.();
    };

    client.on('channel.truncated', handleEvent);

    return () => {
      client.off('channel.truncated', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customHandler]);
};
