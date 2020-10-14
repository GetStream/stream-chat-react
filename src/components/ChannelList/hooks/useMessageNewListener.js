// @ts-check

import { useEffect, useContext } from 'react';
import uniqBy from 'lodash.uniqby';

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
        const channelInList =
          channels.filter((c) => c.cid === e.cid).length > 0;
        if (!channelInList) {
          // @ts-ignore
          const channel = client.channel(e.channel_type, e.channel_id);
          return uniqBy([channel, ...channels], 'cid');
        }
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
