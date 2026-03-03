import { validateAndGetMessage } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { DeleteMessageOptions, LocalMessage } from 'stream-chat';
import type { MessageContextValue } from '../../../context';

export type DeleteMessageNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useDeleteHandler = (
  message?: LocalMessage,
  notifications: DeleteMessageNotifications = {},
): MessageContextValue['handleDelete'] => {
  const { getErrorNotification, notify } = notifications;

  const { deleteMessage, updateMessage } = useChannelActionContext('useDeleteHandler');
  const { client } = useChatContext('useDeleteHandler');
  const { t } = useTranslationContext('useDeleteHandler');

  return async (options?: DeleteMessageOptions) => {
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    try {
      const deletedMessage = await deleteMessage(message, options);
      updateMessage(deletedMessage);
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      if (notify) notify(errorMessage || t('Error deleting message'), 'error');
    }
  };
};
