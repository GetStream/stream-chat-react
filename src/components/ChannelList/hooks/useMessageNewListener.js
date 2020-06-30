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
    client.on('message.new', (e) => {
      setChannels((channels) => {
        if (!lockChannelOrder) return moveChannelUp(e.cid, channels);
        return channels;
      });
    });

    return () => {
      client.off('message.new', () => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockChannelOrder]);
};
