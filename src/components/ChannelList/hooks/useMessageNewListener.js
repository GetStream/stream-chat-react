// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';
import { moveChannelUp } from '../utils';

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 * @param {boolean} [lockChannelOrder]
 */
export const useMessageNewListener = (
  setChannels,
  lockChannelOrder = false,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event} e */
    const handleEvent = (e) => {
      setChannels((channels) => {
        if (!lockChannelOrder) return moveChannelUp(e.cid, channels);
        return channels;
      });
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockChannelOrder]);
};
