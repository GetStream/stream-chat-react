import { useCallback } from 'react';

import type { Notification, NotificationManagerState } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

import { hasSystemNotificationTag } from './useNotificationApi';

export type UseSystemNotificationsFilter = (notification: Notification) => boolean;

export type UseSystemNotificationsOptions = {
  /**
   * Applied after the built-in filter that keeps only notifications tagged for the system banner.
   */
  filter?: UseSystemNotificationsFilter;
};

/**
 * Subscribes to `client.notifications` and returns only **system** banner notifications
 * (same subset `NotificationList` excludes from toasts). Optional `filter` narrows further.
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
