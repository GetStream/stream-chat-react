import { useContext } from 'react';
import { validateAndGetMessage } from '../utils';
import { ChannelContext, TranslationContext } from '../../../context';

/**
 * @type {import('types').usePinHandler}
 */
export const usePinHandler = (message, permissions, notifications) => {
  const { notify, getErrorNotification } = notifications;

  const { client, channel } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  const canPin = () => {
    if (!client || !channel?.state || !permissions) return false;

    const currentChannelPermissions = permissions[channel.type];
    const currentChannelMember = channel.state.members[client.userID];
    const currentChannelWatcher = channel.state.watchers[client.userID];

    if (
      currentChannelPermissions &&
      currentChannelPermissions[client.user?.role]
    ) {
      return true;
    }

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
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message.user]);

        notify(errorMessage || t('Error pinning message'), 'error');
      }
    } else {
      try {
        await client.unpinMessage(message);
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message.user]);

        notify(errorMessage || t('Error removing message pin'), 'error');
      }
    }
  };

  return { canPin: canPin(), handlePin };
};
