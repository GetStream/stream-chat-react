import type { PropsWithChildren } from 'react';
import { useCallback } from 'react';
import type { Notification } from 'stream-chat';
import {
  hasSystemNotificationTag,
  useNotifications,
  useTranslationContext,
  WithComponents,
} from 'stream-chat-react';
import type { NotificationListProps } from 'stream-chat-react';
import { Snackbar } from './Snackbar';
import './SnackbarStack.css';

// The rest wait their turn, so their countdowns don't run while they're out of sight.
const MAX_VISIBLE = 3;

// Takes the props of the list it replaces, so each panel keeps its own stack, and a modal's stack
// sits at the top, where the modal asks for it.
export const SnackbarStack = ({
  className,
  fallbackPanel,
  filter,
  panel,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { t } = useTranslationContext();
  // System notifications belong to a banner, not a panel.
  const panelFilter = useCallback(
    (notification: Notification) =>
      !hasSystemNotificationTag(notification) && (filter?.(notification) ?? true),
    [filter],
  );
  const notifications = useNotifications({
    applyDisplayFilter: true,
    fallbackPanel,
    filter: panelFilter,
    panel,
  });

  if (!notifications.length) return null;

  return (
    <section
      aria-label={t('notification.list.notifications.ariaLabel', 'Notifications')}
      className={[
        'cookbook-snackbar-stack',
        verticalAlignment === 'top' && 'cookbook-snackbar-stack--top',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {notifications.slice(0, MAX_VISIBLE).map((notification) => (
        <Snackbar key={notification.id} notification={notification} />
      ))}
    </section>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { NotificationList: SnackbarStack };

export const WithSnackbars = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
