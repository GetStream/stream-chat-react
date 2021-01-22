import { useContext } from 'react';
import { ChannelContext } from '../../../context';

/**
 * @type {import('types').usePinHandler}
 */
export const usePinHandler = (message, permissions) => {
  const { client, channel } = useContext(ChannelContext);

  const canPin = () => {
    if (!client || !channel?.state || !permissions) return false;

    const currentChannelPermissions = permissions[channel.type];
    const currentChannelMember = channel.state.members[client.userID];
    const currentChannelWatcher = channel.state.watchers[client.userID];

    if (
      currentChannelPermissions &&
      currentChannelPermissions[client.user?.role]
    )
      return true;

    if (
      currentChannelMember &&
      currentChannelPermissions[currentChannelMember.role]
    ) {
      return true;
    }

    if (
      currentChannelWatcher &&
      currentChannelPermissions[currentChannelWatcher.role]
    ) {
      return true;
    }

    return false;
  };

  const handlePin = async (event) => {
    event.preventDefault();

    if (!message) return;

    if (!message.pinned) {
      try {
        await client.pinMessage(message);
      } catch (e) {
        console.log('Cannot pin message:', e);
      }
    } else {
      try {
        await client.unpinMessage(message);
      } catch (e) {
        console.log('Cannot unpin message:', e);
      }
    }
  };

  return { canPin: canPin(), handlePin };
};
