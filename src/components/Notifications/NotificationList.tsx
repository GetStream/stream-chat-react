import React from 'react';
import clsx from 'clsx';
import type { Notification } from 'stream-chat';

import { useQueuedNotifications } from './hooks/useQueuedNotifications';
import { Notification as NotificationComponent } from './Notification';

import type { NotificationTargetPanel } from './notificationOrigin';

const MAX_VISIBLE = 5;

export type NotificationListFilter = (notification: Notification) => boolean;

export type NotificationListProps = {
  /** Optional class name for the list container */
  className?: string;
  /**
   * When provided, this list only shows notifications that pass the filter.
   * Use to declare which notifications this list consumes (e.g. by origin.emitter, origin.context.channelId, or metadata).
   */
  filter?: NotificationListFilter;
  /** Panel target consumed by this list. */
  panel?: NotificationTargetPanel;
  /** Fallback panel when emitted notifications do not include origin.context.panel. */
  fallbackPanel?: NotificationTargetPanel;
  /** Max number of notifications to show (default 5) */
  maxVisibleCount?: number;
};

export const NotificationList = ({
  className,
  fallbackPanel,
  filter,
  maxVisibleCount = MAX_VISIBLE,
  panel,
}: NotificationListProps) => {
  const { visible } = useQueuedNotifications({
    ...(filter ? { filter } : {}),
    ...(panel ? { panel } : {}),
    ...(fallbackPanel ? { fallbackPanel } : {}),
    maxVisibleCount,
  });

  if (visible.length === 0) return null;

  return (
    <div
      aria-label='Notifications'
      className={clsx('str-chat__notification-list', className)}
      data-testid='notification-list'
      role='region'
    >
      <div
        aria-hidden
        className='str-chat__notification-list__edge str-chat__notification-list__edge--top'
      />
      <div className='str-chat__notification-list__scroll'>
        {visible.map((notification) => (
          <NotificationComponent
            key={notification.id}
            notification={notification}
            showClose={notification.expiresAt == null}
          />
        ))}
      </div>
      <div
        aria-hidden
        className='str-chat__notification-list__edge str-chat__notification-list__edge--bottom'
      />
    </div>
  );
};
