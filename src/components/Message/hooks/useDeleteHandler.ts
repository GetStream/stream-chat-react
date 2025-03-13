import { validateAndGetMessage } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

export type DeleteMessageNotifications = {
  getErrorNotification?: (message: StreamMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useDeleteHandler = (
  message?: StreamMessage,
  notifications: DeleteMessageNotifications = {},
): ReactEventHandler => {
  const { getErrorNotification, notify } = notifications;

  const { deleteMessage, updateMessage } = useChannelActionContext('useDeleteHandler');
  const { client } = useChatContext('useDeleteHandler');
  const { t } = useTranslationContext('useDeleteHandler');

  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    try {
      const deletedMessage = await deleteMessage(message);
      updateMessage(deletedMessage);
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      if (notify) notify(errorMessage || t('Error deleting message'), 'error');
    }
  };
};
