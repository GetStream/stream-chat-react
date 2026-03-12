import { useMemo } from 'react';
import { useNotifications } from './useNotifications';

import type { Notification } from 'stream-chat';
import type { UseNotificationsOptions } from './useNotifications';

export type UseQueuedNotificationsOptions = UseNotificationsOptions & {
  maxVisibleCount: number;
};

export type QueuedNotifications = {
  all: Notification[];
  queued: Notification[];
  queuedCount: number;
  visible: Notification[];
};

/**
 * Returns notifications split into visible and queued buckets.
 * Visible notifications are rendered immediately; queued notifications stay pending
 * until visible slots are freed.
 */
export const useQueuedNotifications = (
  options: UseQueuedNotificationsOptions,
): QueuedNotifications => {
  const { maxVisibleCount, ...notificationsOptions } = options;
  const notifications = useNotifications(notificationsOptions);

  return useMemo(() => {
    const safeMaxVisibleCount = Math.max(0, maxVisibleCount);
    const visible = notifications.slice(0, safeMaxVisibleCount);
    const queued = notifications.slice(safeMaxVisibleCount);

    return {
      all: notifications,
      queued,
      queuedCount: queued.length,
      visible,
    };
  }, [maxVisibleCount, notifications]);
};
