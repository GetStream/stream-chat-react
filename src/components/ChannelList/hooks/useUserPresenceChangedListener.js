import { useEffect, useContext } from 'react';
import { ChatContext } from '../../../context';

export const useUserPresenceChangedListener = (setChannels) => {
  const { client } = useContext(ChatContext);
  useEffect(() => {
    const handleEvent = (e) => {
      setChannels((channels) => {
        const newChannels = channels.map((channel) => {
          if (!channel.state.members[e.user.id]) return channel;

          channel.state.members.setIn([e.user.id, 'user'], e.user);

          return channel;
        });

        return [...newChannels];
      });
    };

    client.on('user.presence.changed', (e) => {
      handleEvent(e);
    });

    return () => {
      client.off('user.presence.changed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
