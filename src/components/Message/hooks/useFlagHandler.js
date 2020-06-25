// @ts-check
import { useContext } from 'react';
import { ChannelContext, TranslationContext } from '../../../context';
import { validateAndGetMessage } from '../utils';

/**
 * @typedef {{
 *   notify?: import('types').MessageComponentProps['addNotification'],
 *   getSuccessNotification?: import('types').MessageComponentProps['getMuteUserSuccessNotification'],
 *   getErrorNotification?: import('types').MessageComponentProps['getMuteUserErrorNotification'],
 * }} NotificationArg
 * @type {(message: import('stream-chat').MessageResponse | undefined, notification: NotificationArg) => (event: React.MouseEvent<HTMLElement>) => Promise<void>}
 */
export const useFlagHandler = (message, notifications) => {
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { client } = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  return async (event) => {
    event.preventDefault();
    const {
      notify,
      getSuccessNotification,
      getErrorNotification,
    } = notifications;
    if (!client || !t || !notify || !message) {
      return;
    }
    try {
      await client.flagMessage(message.id);
      const successMessage =
        getSuccessNotification &&
        validateAndGetMessage(getSuccessNotification, [message]);
      notify(
        successMessage || t('Message has been successfully flagged'),
        'success',
      );
    } catch (e) {
      const errorMessage =
        getErrorNotification &&
        validateAndGetMessage(getErrorNotification, [message]);
      notify(
        errorMessage ||
          t(
            'Error adding flag: Either the flag already exist or there is issue with network connection ...',
          ),
        'error',
      );
    }
  };
};
