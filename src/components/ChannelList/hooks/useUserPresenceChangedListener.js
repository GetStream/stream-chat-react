// @ts-check

import { useContext, useEffect } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 */
export const useUserPresenceChangedListener = (setChannels) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event} event */
    const handleEvent = (event) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!event.user?.id || !channel.state.members[event.user.id])
            return channel;

          const newChannel = channel; // dumb workaround for linter
          newChannel.state.members[event.user.id].user = event.user;

          return newChannel;
        });

        return [...newChannels];
      });
    };

    client.on('user.presence.changed', handleEvent);

    return () => {
      client.off('user.presence.changed', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
