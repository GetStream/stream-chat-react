import { type ComponentType, useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Notification, NotificationSeverity } from 'stream-chat';

import {
  IconCheckmark,
  IconExclamationCircleFill,
  IconExclamationTriangleFill,
  IconLoading,
  createIcon,
  useSystemNotifications,
} from 'stream-chat-react';

export const IconInfoCircle = createIcon(
  'IconInfoCircle',
  <path
    d='M4.42891 16.875L12.9953 8.30781C13.0534 8.2497 13.1223 8.2036 13.1982 8.17215C13.274 8.1407 13.3554 8.12451 13.4375 8.12451C13.5196 8.12451 13.601 8.1407 13.6768 8.17215C13.7527 8.2036 13.8216 8.2497 13.8797 8.30781L16.875 11.3039M3.75 3.125H16.25C16.5952 3.125 16.875 3.40482 16.875 3.75V16.25C16.875 16.5952 16.5952 16.875 16.25 16.875H3.75C3.40482 16.875 3.125 16.5952 3.125 16.25V3.75C3.125 3.40482 3.40482 3.125 3.75 3.125ZM8.75 7.5C8.75 8.19036 8.19036 8.75 7.5 8.75C6.80964 8.75 6.25 8.19036 6.25 7.5C6.25 6.80964 6.80964 6.25 7.5 6.25C8.19036 6.25 8.75 6.80964 8.75 7.5Z'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='1.5'
  />,
);
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
