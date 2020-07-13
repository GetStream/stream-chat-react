// @ts-check

import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {React.Dispatch<React.SetStateAction<import('stream-chat').Channel[]>>} SetChannels
 * @param {SetChannels} setChannels
 */
export const useUserPresenceChangedListener = (setChannels) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    /** @param {import('stream-chat').Event<string>} e */
    const handleEvent = (e) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!e.user?.id || !channel.state.members[e.user.id]) return channel;

          channel.state.members.setIn([e.user.id, 'user'], e.user);

          return channel;
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
