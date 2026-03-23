import React, { type ComponentType, forwardRef } from 'react';
import clsx from 'clsx';
import type { NotificationSeverity } from 'stream-chat';
import { type Notification as NotificationType } from 'stream-chat';

import {
  IconArrowRotateRightLeftRepeatRefresh,
  IconCheckmark2,
  IconCrossMedium,
  IconExclamationCircle,
  IconExclamationTriangle,
} from '../../components/Icons';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { Button } from '../Button';

type NotificationEntryDirection = 'bottom' | 'left' | 'right' | 'top';
type NotificationTransitionState = 'enter' | 'exit';

export type NotificationIconProps = {
  notification: NotificationType;
};

const IconsBySeverity: Record<NotificationSeverity, ComponentType | null> = {
  error: IconExclamationCircle,
  info: null, // IconCircleInfoTooltip,
  loading: IconArrowRotateRightLeftRepeatRefresh,
  success: IconCheckmark2,
  warning: IconExclamationTriangle,
};

const DefaultNotificationIcon = ({ notification }: NotificationIconProps) => {
  if (!notification.severity) return null;

  const Icon = IconsBySeverity[notification.severity] ?? null;
  return (
    Icon && (
      <div className='str-chat__notification-icon'>
        <Icon />
      </div>
    )
  );
};

export type NotificationProps = {
  /** Notification from client.notifications state */
  notification: NotificationType;
  /** Optional class name */
  className?: string;
  /** Direction from which the notification enters. */
  entryDirection?: NotificationEntryDirection;
  /** Optional custom icon component. */
  Icon?: React.ComponentType<NotificationIconProps>;
  /** Optional dismiss handler */
  onDismiss?: () => void;
  /** Show close button (for persistent notifications) */
  showClose?: boolean;
  /** Optional transition state applied by NotificationList. */
  transitionState?: NotificationTransitionState;
};

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      entryDirection,
      Icon = DefaultNotificationIcon,
      notification,
      onDismiss,
      showClose = false,
      transitionState,
    }: NotificationProps,
    ref,
  ) => {
    const { client } = useChatContext();
    const { t } = useTranslationContext();

    const displayMessage = t('translationBuilderTopic/notification', {
      notification,
      value: notification.message,
    });

    const handleDismiss = () => {
      if (onDismiss) {
        onDismiss();
        return;
      }

      client.notifications.remove(notification.id);
    };

    const isPersistent = !notification.duration;

    const severity = notification.severity;

    return (
      <div
        aria-live='polite'
        className={clsx(
          'str-chat__notification',
          entryDirection && `str-chat__notification--enter-from-${entryDirection}`,
          transitionState === 'enter' && 'str-chat__notification--is-entering',
          transitionState === 'exit' && 'str-chat__notification--is-exiting',
          severity && `str-chat__notification--${severity}`,
          severity === 'loading' && 'str-chat__notification--loading',
          className,
        )}
        data-testid='notification'
        ref={ref}
      >
        <div className='str-chat__notification-content'>
          {Icon && <Icon notification={notification} />}
          <div className='str-chat__notification-message'>{displayMessage}</div>
        </div>
        {notification.actions && notification.actions.length > 0 && (
          <div className='str-chat__notification-actions'>
            {notification.actions.map((action, index) => (
              <Button
                appearance='outline'
                className='str-chat__notification-action'
                inverseTheme
                key={index}
                onClick={() => {
                  action.handler();
                }}
                size='sm'
                variant='secondary'
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
        {(showClose || isPersistent) && (
          <Button
            appearance='ghost'
            aria-label='Dismiss'
            circular
            className='str-chat__notification-close-button'
            inverseTheme
            onClick={handleDismiss}
            size='sm'
            variant='secondary'
          >
            <IconCrossMedium />
          </Button>
        )}
      </div>
    );
  },
);

Notification.displayName = 'Notification';
