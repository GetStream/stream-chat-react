// @ts-check

import { useContext, useEffect } from 'react';
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
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event} event */
    const handleEvent = (event) => {
      setChannels((channels) => {
        const channelInList =
          channels.filter((channel) => channel.cid === event.cid).length > 0;
        if (
          !channelInList &&
          allowNewMessagesFromUnfilteredChannels &&
          event.channel_type
        ) {
          const channel = client.channel(event.channel_type, event.channel_id);
          return uniqBy([channel, ...channels], 'cid');
        }
        if (!lockChannelOrder) return moveChannelUp(event.cid, channels);
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
