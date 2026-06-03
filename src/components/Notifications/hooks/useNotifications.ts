import { useCallback } from 'react';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { Notification, NotificationManagerState } from 'stream-chat';
import { useNotificationConfigurationContext } from '../NotificationConfigurationContext';
import { isNotificationForPanel } from '../notificationTarget';

import type { NotificationTargetPanel } from '../notificationTarget';

export type UseNotificationsFilter = (notification: Notification) => boolean;

export type UseNotificationsOptions = {
  /**
   * When true, the configured Chat-level notificationDisplayFilter is applied after
   * panel routing and before the local filter.
   */
  applyDisplayFilter?: boolean;
  /**
   * When provided, only notifications that pass this filter are returned.
   * Use to have a given NotificationList consume only a subset of client.notifications
   * (e.g. by origin.emitter, origin.context, or metadata).
   */
  filter?: UseNotificationsFilter;
  /**
   * Panel target consumed by a specific notification list.
   */
  panel?: NotificationTargetPanel;
  /**
   * Fallback panel used when origin.context.panel is absent.
   * Defaults to `channel`.
   */
  fallbackPanel?: NotificationTargetPanel;
};

/**
 * Subscribes to client.notifications.store and returns the list of notifications.
 * Optionally pass a filter so only notifications that match are returned (e.g. for a specific NotificationList).
 */
export const useNotifications = (options?: UseNotificationsOptions): Notification[] => {
  const { client } = useChatContext();
  const { displayFilter } = useNotificationConfigurationContext();
  const { applyDisplayFilter, fallbackPanel, filter, panel } = options ?? {};
  const selector = useCallback(
    (state: NotificationManagerState) => {
      const notifications = state.notifications;
      return {
        notifications: notifications.filter((notification) => {
          if (
            panel &&
            !isNotificationForPanel(notification, panel, {
              fallbackPanel,
            })
          ) {
            return false;
          }

          if (
            applyDisplayFilter &&
            !displayFilter({
              fallbackPanel,
              filter,
              notification,
              panel,
            })
          ) {
            return false;
          }

          return filter ? filter(notification) : true;
        }),
      };
    },
    [applyDisplayFilter, displayFilter, fallbackPanel, filter, panel],
  );

  const { notifications } = useStateStore(client.notifications.store, selector);

  return notifications;
};
