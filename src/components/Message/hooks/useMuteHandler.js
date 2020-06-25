// @ts-check
import { useContext } from 'react';
import { isUserMuted, validateAndGetMessage } from '../utils';
import { ChannelContext, TranslationContext } from '../../../context';

/**
 * @typedef {{
 *   notify?: import('types').MessageComponentProps['addNotification'],
 *   getSuccessNotification?: import('types').MessageComponentProps['getMuteUserSuccessNotification'],
 *   getErrorNotification?: import('types').MessageComponentProps['getMuteUserErrorNotification'],
 * }} NotificationArg
 * @type {(message: import('stream-chat').MessageResponse | undefined, notification: NotificationArg) => (event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */
export const useMuteHandler = (message, notifications) => {
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { client, mutes } = useContext(ChannelContext);

  /**
   *@type {import('types').TranslationContextValue}
   */
  const { t } = useContext(TranslationContext);

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  return async (event) => {
    event.preventDefault();
    const {
      notify,
      getSuccessNotification,
      getErrorNotification,
    } = notifications;

    if (!t || !message?.user || !notify || !client) {
      return;
    }
    if (!isUserMuted(message, mutes)) {
      try {
        await client.muteUser(message.user.id);
        const successMessage =
          getSuccessNotification &&
          validateAndGetMessage(getSuccessNotification, [message.user]);

        notify(
          successMessage ||
            t(`{{ user }} has been muted`, {
              user: message.user.name || message.user.id,
            }),
          'success',
        );
      } catch (e) {
        const errorMessage =
          getErrorNotification &&
          validateAndGetMessage(getErrorNotification, [message.user]);

        notify(errorMessage || t('Error muting a user ...'), 'error');
      }
    } else {
      try {
        await client.unmuteUser(message.user.id);
        const fallbackMessage = t(`{{ user }} has been unmuted`, {
          user: message.user.name || message.user.id,
        });
        const successMessage =
          (getSuccessNotification &&
            validateAndGetMessage(getSuccessNotification, [message.user])) ||
          fallbackMessage;

        if (typeof successMessage === 'string') {
          notify(successMessage, 'success');
        }
      } catch (e) {
        const errorMessage =
          (getErrorNotification &&
            validateAndGetMessage(getErrorNotification, [message.user])) ||
          t('Error unmuting a user ...');
        if (typeof errorMessage === 'string') {
          notify(errorMessage, 'error');
        }
      }
    }
  };
};
