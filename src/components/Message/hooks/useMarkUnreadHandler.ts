import { validateAndGetMessage } from '../utils';
import { useChannel } from '../../../context';

import type { LocalMessage } from 'stream-chat';
import type { ReactEventHandler } from '../types';

export type MarkUnreadHandlerNotifications = {
  getErrorNotification?: (message: LocalMessage) => string;
  getSuccessNotification?: (message: LocalMessage) => string;
  notify?: (notificationText: string, type: 'success' | 'error') => void;
};

export const useMarkUnreadHandler = (
  message?: LocalMessage,
  notifications: MarkUnreadHandlerNotifications = {},
): ReactEventHandler => {
  const { getSuccessNotification, notify } = notifications;

  const channel = useChannel();

  return async (event) => {
    event.preventDefault();
    if (!message?.id) {
      console.warn('Mark unread handler does not have access to message id');
      return;
    }

    // Let request failures propagate so the caller (e.g. MessageActions' MarkUnread control, which
    // wraps every action in try/catch and reports failures through useNotificationApi) can surface
    // the error. The optional `notify` bridge remains for direct callers that want a success toast.
    await channel.markUnread({ message_id: message.id });
    if (!notify) return;
    const successMessage =
      getSuccessNotification && validateAndGetMessage(getSuccessNotification, [message]);
    if (successMessage) notify(successMessage, 'success');
  };
};
