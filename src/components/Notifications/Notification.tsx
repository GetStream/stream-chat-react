import React from 'react';
import clsx from 'clsx';
import type { Notification as NotificationType } from 'stream-chat';

import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

export type NotificationProps = {
  /** Notification from client.notifications state */
  notification: NotificationType;
  /** Show close button (for persistent notifications) */
  showClose?: boolean;
  /** Optional class name */
  className?: string;
};

export const Notification = ({
  className,
  notification,
  showClose = false,
}: NotificationProps) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();

  const displayMessage = t('translationBuilderTopic/notification', {
    notification,
    value: notification.message,
  });

  const onDismiss = () => {
    client.notifications.remove(notification.id);
  };

  const isPersistent = notification.expiresAt == null;

  return (
    <div
      aria-live='polite'
      className={clsx(
        'str-chat__notification',
        'str-chat__notification-list-item',
        `str-chat__notification--${notification.severity}`,
        className,
      )}
      data-testid='notification'
    >
      <span className='str-chat__notification-message'>{displayMessage}</span>
      {notification.actions && notification.actions.length > 0 && (
        <div className='str-chat__notification-actions'>
          {notification.actions.map((action, index) => (
            <button
              className='str-chat__notification-action'
              key={index}
              onClick={() => {
                action.handler();
              }}
              type='button'
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {(showClose || isPersistent) && (
        <button
          aria-label='Dismiss'
          className='str-chat__notification-close'
          onClick={onDismiss}
          type='button'
        />
      )}
    </div>
  );
};
