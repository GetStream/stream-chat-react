import type { ComponentType, FocusEvent } from 'react';
import { useEffect, useRef } from 'react';
import type { Notification } from 'stream-chat';
import {
  Button,
  IconCheckmark,
  IconExclamationCircleFill,
  IconExclamationTriangleFill,
  IconInfo,
  IconXmark,
  useChatContext,
  useNotificationApi,
  useTranslationContext,
} from 'stream-chat-react';
import './Snackbar.css';

const iconsBySeverity: Record<string, ComponentType> = {
  error: IconExclamationCircleFill,
  info: IconInfo,
  success: IconCheckmark,
  warning: IconExclamationTriangleFill,
};

export const Snackbar = ({ notification }: { notification: Notification }) => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { ensureNotificationTimeout, removeNotification } = useNotificationApi();
  const { actions, id, severity = 'info' } = notification;
  const Icon = iconsBySeverity[severity];

  // The countdown starts once the snackbar is on screen. A notification without a duration has
  // none, and stays until it's dismissed.
  useEffect(() => {
    ensureNotificationTimeout(id);
  }, [ensureNotificationTimeout, id]);

  // Hovering or focusing the snackbar stops its countdown. It starts a full one again only once
  // the pointer has left and focus has moved out of the snackbar.
  const hovered = useRef(false);
  const focused = useRef(false);
  const pause = () => client.notifications.clearTimeout(id);
  const resumeUnlessHeld = () => {
    if (!hovered.current && !focused.current) ensureNotificationTimeout(id);
  };
  const handleMouseEnter = () => {
    hovered.current = true;
    pause();
  };
  const handleMouseLeave = () => {
    hovered.current = false;
    resumeUnlessHeld();
  };
  const handleFocus = () => {
    focused.current = true;
    pause();
  };
  // Focus moving between the snackbar's buttons stays inside it.
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    focused.current = false;
    resumeUnlessHeld();
  };

  // The same text the SDK's notifications show: a translator for the type, or the message.
  const message = t('translationBuilderTopic.notification', {
    notification,
    value: notification.message,
  });

  return (
    <div
      className={`cookbook-snackbar cookbook-snackbar--${severity}`}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {Icon && (
        <span aria-hidden className='cookbook-snackbar__icon'>
          <Icon />
        </span>
      )}
      <span className='cookbook-snackbar__message'>{message}</span>
      {actions?.map((action) => (
        <Button
          appearance='ghost'
          className='cookbook-snackbar__action'
          key={action.label}
          onClick={() => {
            action.handler();
            removeNotification(id);
          }}
          size='sm'
          variant='primary'
        >
          {action.label}
        </Button>
      ))}
      <Button
        appearance='ghost'
        aria-label={t(
          'notification.dismissNotification.ariaLabel',
          'Dismiss notification',
        )}
        circular
        className='cookbook-snackbar__dismiss'
        onClick={() => removeNotification(id)}
        size='sm'
        variant='secondary'
      >
        <IconXmark />
      </Button>
    </div>
  );
};
