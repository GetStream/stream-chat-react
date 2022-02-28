import { validateAndGetMessage } from '../utils';

import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { ReactEventHandler } from '../types';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type DeleteMessageNotifications<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  getErrorNotification?: (message: StreamMessage<StreamChatGenerics>) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useDeleteHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: StreamMessage<StreamChatGenerics>,
  notifications: DeleteMessageNotifications<StreamChatGenerics> = {},
): ReactEventHandler => {
  const { getErrorNotification, notify } = notifications;

  const { updateMessage } = useChannelActionContext<StreamChatGenerics>('useDeleteHandler');
  const { client } = useChatContext<StreamChatGenerics>('useDeleteHandler');
  const { t } = useTranslationContext('useDeleteHandler');

  return async (event) => {
    event.preventDefault();
    if (!message?.id || !client || !updateMessage) {
      return;
    }

    try {
      const data = await client.deleteMessage(message.id);
      updateMessage(data.message);
    } catch (e) {
      const errorMessage =
        getErrorNotification && validateAndGetMessage(getErrorNotification, [message]);

      if (notify) notify(errorMessage || t('Error deleting message'), 'error');
    }
  };
};
