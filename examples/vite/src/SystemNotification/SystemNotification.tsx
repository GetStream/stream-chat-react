import { type ComponentType, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Notification, NotificationSeverity } from 'stream-chat';

import {
  IconCheckmark,
  IconExclamationCircleFill,
  IconExclamationTriangleFill,
  IconInfoCircle,
  IconLoading,
  useSystemNotifications,
} from 'stream-chat-react';

const IconsBySeverity: Record<NotificationSeverity, ComponentType | null> = {
  error: IconExclamationCircleFill,
  info: IconInfoCircle,
  loading: IconLoading,
  success: IconCheckmark,
  warning: IconExclamationTriangleFill,
};

type SystemNotificationFilter = (notification: Notification) => boolean;

export type SystemNotificationProps = {
  /** Optional class name for the container */
  className?: string;
  /** Optional additional filter applied after the default system-tag filter. */
  filter?: SystemNotificationFilter;
};

const SLIDE_OUT_ANIMATION_NAME = 'str-chat__system-notification-slide-out';

export const SystemNotification = ({ className, filter }: SystemNotificationProps) => {
  const notifications = useSystemNotifications(filter ? { filter } : undefined);
  const notification = notifications[0];

  const [retainedNotification, setRetainedNotification] = useState<
    Notification | undefined
  >(notification);

  useEffect(() => {
    if (notification) {
      setRetainedNotification(notification);
    }
  }, [notification]);

  const isExiting = !notification && !!retainedNotification;
  const rendered = notification ?? retainedNotification;

  if (!rendered) return null;

  const Icon = rendered.severity
    ? (IconsBySeverity[rendered.severity] ?? null)
    : IconExclamationCircleFill;
  const action = rendered.actions?.[0];

  return (
    <div className='str-chat__system-notification-anchor'>
      <div
        aria-live='polite'
        className={clsx(
          'str-chat__system-notification',
          {
            'str-chat__system-notification--exiting': isExiting,
            'str-chat__system-notification--interactive': action,
            [`str-chat__system-notification--${rendered.severity}`]: rendered.severity,
          },
          className,
        )}
        data-testid='system-notification'
        onAnimationEnd={(e) => {
          if (e.animationName === SLIDE_OUT_ANIMATION_NAME) {
            setRetainedNotification(undefined);
          }
        }}
        onClick={action?.handler}
        onKeyDown={
          action
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  action.handler();
                }
              }
            : undefined
        }
        role={action ? 'button' : 'status'}
        tabIndex={action ? 0 : undefined}
      >
        {Icon && (
          <span aria-hidden className='str-chat__system-notification-icon'>
            <Icon />
          </span>
        )}
        <span className='str-chat__system-notification-message'>{rendered.message}</span>
      </div>
    </div>
  );
};
