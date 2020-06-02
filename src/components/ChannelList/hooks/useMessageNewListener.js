import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';
import { moveChannelUp } from '../utils';

export const useMessageNewListener = (setChannels) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    client.on('message.new', (e) => {
      setChannels((channels) => {
        return moveChannelUp(e.cid, channels);
      });
    });

    return () => {
      client.off('message.new');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
