import React, { type ComponentType, forwardRef } from 'react';
import clsx from 'clsx';
import type { NotificationSeverity } from 'stream-chat';
import { type Notification as NotificationType } from 'stream-chat';

import { useComponentContextIcons } from '../../context';
import { useTranslationContext } from '../../context/TranslationContext';
import { Button } from '../Button';
import { useNotificationApi } from './hooks/useNotificationApi';

type NotificationEntryDirection = 'bottom' | 'left' | 'right' | 'top';
type NotificationTransitionState = 'enter' | 'exit';

export type NotificationIconProps = {
  notification: NotificationType;
};

const DefaultNotificationIcon = ({ notification }: NotificationIconProps) => {
  const { IconCheckmark, IconExclamationMark, IconExclamationTriangleFill, IconRefresh } =
    useComponentContextIcons();

  const IconsBySeverity: Record<NotificationSeverity, ComponentType | null> = {
    error: IconExclamationMark,
    info: null,
    loading: IconRefresh,
    success: IconCheckmark,
    warning: IconExclamationTriangleFill,
  };

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
  /** Notification from the `client.notifications` state. */
  notification: NotificationType;
  className?: string;
  /** Direction from which the notification enters. */
  entryDirection?: NotificationEntryDirection;
  /** Icon component. Defaults to a severity-based icon. */
  Icon?: React.ComponentType<NotificationIconProps>;
  /** Called on dismiss. Defaults to removing the notification. */
  onDismiss?: () => void;
  /** Shows the close button; persistent notifications (no `duration`) always show it. */
  showClose?: boolean;
  /** Transition state set by `NotificationList`. */
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
    const { removeNotification } = useNotificationApi();
    const { t } = useTranslationContext();
    const { IconXmark } = useComponentContextIcons();

    const displayMessage = t('translationBuilderTopic.notification', {
      notification,
      value: notification.message,
    });

    const handleDismiss = () => {
      if (onDismiss) {
        onDismiss();
        return;
      }

      removeNotification(notification.id);
    };

    const isPersistent = !notification.duration;

    const severity = notification.severity;
    // The priority follows severity (errors are assertive, the rest polite) unless
    // `metadata.ariaLive` overrides it (see the `ariaLive` option of `addNotification`).
    const ariaLiveOverride = notification.metadata?.ariaLive;
    const livePriority: 'assertive' | 'polite' =
      ariaLiveOverride === 'assertive' || ariaLiveOverride === 'polite'
        ? ariaLiveOverride
        : severity === 'error'
          ? 'assertive'
          : 'polite';

    return (
      <div
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
          <div
            aria-atomic='true'
            aria-live={livePriority}
            className='str-chat__notification-message'
            role={livePriority === 'assertive' ? 'alert' : 'status'}
          >
            {displayMessage}
          </div>
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
            aria-label={t(
              'notification.dismissNotification.ariaLabel',
              'Dismiss notification',
            )}
            circular
            className='str-chat__notification-close-button'
            inverseTheme
            onClick={handleDismiss}
            size='sm'
            variant='secondary'
          >
            <IconXmark />
          </Button>
        )}
      </div>
    );
  },
);

Notification.displayName = 'Notification';
