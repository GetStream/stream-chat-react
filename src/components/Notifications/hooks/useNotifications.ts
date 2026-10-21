import { useCallback } from 'react';
import { useChatContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { Notification, NotificationManagerState } from 'stream-chat';
import { useNotificationConfigurationContext } from '../NotificationConfigurationContext';
import { isNotificationForPanel } from '../notificationTarget';

import type { NotificationTargetPanel } from '../notificationTarget';

export type UseNotificationsFilter = (notification: Notification) => boolean;

export type UseNotificationsOptions = {
  /** Applies the Chat-level display filter after panel routing and before `filter`. */
  applyDisplayFilter?: boolean;
  /** Keeps only the notifications that pass it, e.g. by `origin.emitter` or `metadata`. */
  filter?: UseNotificationsFilter;
  /** Keeps only notifications targeted at this panel. */
  panel?: NotificationTargetPanel;
  /** Panel assumed for notifications that name none. Defaults to `channel`. */
  fallbackPanel?: NotificationTargetPanel;
};

/**
 * Subscribes to `client.notifications.store` and returns the notifications that pass the options.
 *
 * @param options - Panel routing and filters. Returns every notification when omitted.
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
