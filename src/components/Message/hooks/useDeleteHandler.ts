import { validateAndGetMessage } from '../utils';

import { useChannel, useChatContext } from '../../../context';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useMessagePaginator } from '../../../hooks';
import { useThreadContext } from '../../Threads';

import { type DeleteMessageOptions, formatMessage, type LocalMessage } from 'stream-chat';
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

  const channel = useChannel();
  const thread = useThreadContext();
  const { client } = useChatContext('useDeleteHandler');
  const { t } = useTranslationContext('useDeleteHandler');
  const messagePaginator = useMessagePaginator();

  return async (options?: DeleteMessageOptions) => {
    if (!message?.id || !client) {
      return;
    }

    try {
      const entity = thread ?? channel;
      if (entity.deleteMessageWithLocalUpdate) {
        await entity.deleteMessageWithLocalUpdate({
          localMessage: formatMessage(message),
          options,
        });
      } else {
        const deletedMessage = (await client.deleteMessage(message.id, options)).message;
        messagePaginator.ingestItem(formatMessage(deletedMessage));
      }
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      if (notify) notify(errorMessage || t('Error deleting message'), 'error');
    }
  };
};
