import React, { useContext, useMemo } from 'react';

import type { Notification } from 'stream-chat';
import type { PropsWithChildrenOnly } from '../../types/types';
import type { NotificationTargetPanel } from './notificationTarget';
import type { NotificationListFilter } from './NotificationList';

export type NotificationDisplayFilterParams = {
  /** Fallback panel used by the receiving NotificationList when a notification has no explicit target. */
  fallbackPanel?: NotificationTargetPanel;
  /** Local NotificationList filter. Runs only after the display filter accepts the notification. */
  filter?: NotificationListFilter;
  /** Notification being evaluated after panel/fallback routing matched it to this list. */
  notification: Notification;
  /** Panel of the NotificationList currently evaluating the notification. */
  panel?: NotificationTargetPanel;
};

export type NotificationDisplayFilter = (
  params: NotificationDisplayFilterParams,
) => boolean;

export type NotificationConfigurationContextValue = {
  displayFilter: NotificationDisplayFilter;
};

const defaultNotificationDisplayFilter: NotificationDisplayFilter = () => true;

const defaultNotificationConfigurationContextValue: NotificationConfigurationContextValue =
  {
    displayFilter: defaultNotificationDisplayFilter,
  };

const NotificationConfigurationContext =
  React.createContext<NotificationConfigurationContextValue>(
    defaultNotificationConfigurationContextValue,
  );

export type NotificationConfigurationProviderProps = PropsWithChildrenOnly & {
  displayFilter?: NotificationDisplayFilter;
};

export const NotificationConfigurationProvider = ({
  children,
  displayFilter,
}: NotificationConfigurationProviderProps) => {
  const parentConfiguration = useContext(NotificationConfigurationContext);
  const value = useMemo<NotificationConfigurationContextValue>(
    () => ({
      displayFilter: displayFilter ?? parentConfiguration.displayFilter,
    }),
    [displayFilter, parentConfiguration.displayFilter],
  );

  return (
    <NotificationConfigurationContext.Provider value={value}>
      {children}
    </NotificationConfigurationContext.Provider>
  );
};

export const useNotificationConfigurationContext = () =>
  useContext(NotificationConfigurationContext);
