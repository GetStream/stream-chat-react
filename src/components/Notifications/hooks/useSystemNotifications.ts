import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

import { hasSystemNotificationTag } from './useNotificationApi';

export type UseSystemNotificationsFilter = (notification: Notification) => boolean;

export type UseSystemNotificationsOptions = {
  /** Applied after the built-in filter for system-tagged notifications. */
  filter?: UseSystemNotificationsFilter;
};

/**
 * Subscribes to `client.notifications` and returns the system banner notifications, which
 * `NotificationList` leaves out of its toasts.
 *
 * @param options.filter - Narrows the system notifications further.
 */
export const useSystemNotifications = (
  options?: UseSystemNotificationsOptions,
): Notification[] => {
  const { client } = useChatContext();
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const withSystemTag = state.notifications.filter(hasSystemNotificationTag);
      const notifications = options?.filter
        ? withSystemTag.filter(options.filter)
        : withSystemTag;

      return { notifications };
    },
    [options?.filter],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
