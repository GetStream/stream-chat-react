import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import type { Notification } from 'stream-chat';
import {
  IconCheckmark,
  IconExclamationCircleFill,
  IconExclamationTriangleFill,
  IconInfo,
  IconLoading,
  useSystemNotifications,
} from 'stream-chat-react';
import './SystemNotificationBanner.css';

const iconsBySeverity: Record<string, ComponentType> = {
  error: IconExclamationCircleFill,
  info: IconInfo,
  loading: IconLoading,
  success: IconCheckmark,
  warning: IconExclamationTriangleFill,
};

export const SystemNotificationBanner = () => {
  const [notification] = useSystemNotifications();
  // Without animations there is no slide-out to wait for, so the bar goes at once.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The last notification shown, kept while the bar slides out.
  const [retained, setRetained] = useState<Notification | undefined>(notification);

  useEffect(() => {
    if (notification) setRetained(notification);
    else if (reduceMotion) setRetained(undefined);
  }, [notification, reduceMotion]);

  const shown = notification ?? (reduceMotion ? undefined : retained);
  const isExiting = !notification;
  // A bar on its way out no longer acts on a click.
  const action = isExiting ? undefined : shown?.actions?.[0];
  const Icon = shown && iconsBySeverity[shown.severity ?? 'error'];

  const className = [
    'cookbook-system-banner',
    shown?.severity && `cookbook-system-banner--${shown.severity}`,
    isExiting && 'cookbook-system-banner--exiting',
    action && 'cookbook-system-banner--interactive',
  ]
    .filter(Boolean)
    .join(' ');

  // The status region stays rendered, so screen readers announce each message put into it.
  return (
    <div role='status'>
      {shown && (
        <div
          className={className}
          onAnimationEnd={(event) => {
            if (event.animationName === 'cookbook-system-banner-slide-out') {
              setRetained(undefined);
            }
          }}
          onClick={action?.handler}
          onKeyDown={(event) => {
            if (action && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              action.handler();
            }
          }}
          role={action ? 'button' : undefined}
          tabIndex={action ? 0 : undefined}
        >
          {Icon && (
            <span aria-hidden className='cookbook-system-banner__icon'>
              <Icon />
            </span>
          )}
          <span className='cookbook-system-banner__message'>{shown.message}</span>
        </div>
      )}
    </div>
  );
};
