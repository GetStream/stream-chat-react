import { validateAndGetMessage } from '../utils';

import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export const missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';

export type FlagMessageNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  getSuccessNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useFlagHandler = (
  message?: LocalMessage,
  notifications: FlagMessageNotifications = {},
): ReactEventHandler => {
  const { client } = useChatContext('useFlagHandler');
  const { t } = useTranslationContext('useFlagHandler');

  return async (event) => {
    event.preventDefault();

    const { getErrorNotification, getSuccessNotification, notify } = notifications;

    if (!client || !t || !notify || !message?.id) {
      console.warn(missingUseFlagHandlerParameterWarning);
      return;
    }

    if (client.user?.banned) {
      return notify(t('Error adding flag'), 'error');
    }

    try {
      await client.flagMessage(message.id);

      const successMessage =
        getSuccessNotification &&
        validateAndGetMessage(getSuccessNotification, [message]);

      notify(successMessage || t('Message has been successfully flagged'), 'success');
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      notify(errorMessage || t('Error adding flag'), 'error');
    }
  };
};
