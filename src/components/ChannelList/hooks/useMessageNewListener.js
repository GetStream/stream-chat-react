import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';
import { moveChannelUp } from '../utils';

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
      client.off('message.new');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockChannelOrder]);
};
