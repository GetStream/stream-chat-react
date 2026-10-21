import { useEffect, useRef } from 'react';
import type { Notification } from 'stream-chat';

import { useAnnouncementQueue } from './scheduling';
import { useAriaLiveAnnouncer } from './useAriaLiveAnnouncer';
import type { AriaLivePriority } from './useAriaLiveAnnouncer';
import { useNotifications } from '../Notifications';
import { useTranslationContext } from '../../context';

export type NotificationAnnouncementBuilderParams = {
  defaultMessage: string;
  notification: Notification;
  translatedMessage: string;
};

export type NotificationAnnouncementBuilder = (
  params: NotificationAnnouncementBuilderParams,
) => string;
export type NotificationAnnouncementFilter = (notification: Notification) => boolean;

const getAnnouncementPriority = (notification: Notification): AriaLivePriority =>
  notification.severity === 'error' ? 'assertive' : 'polite';

const getSeverityLabel = (notification: Notification) => {
  if (!notification.severity) return null;
  return `${notification.severity[0].toUpperCase()}${notification.severity.slice(1)}`;
};

const getDefaultAnnouncementMessage = (notification: Notification, message: string) => {
  const severityLabel = getSeverityLabel(notification);

  if (severityLabel) {
    return `${severityLabel} notification: ${message}`;
  }

  return `Notification: ${message}`;
};

export type NotificationAnnouncerProps = {
  buildNotificationAnnouncement?: NotificationAnnouncementBuilder;
  notificationFilter?: NotificationAnnouncementFilter;
};

const defaultBuildNotificationAnnouncement: NotificationAnnouncementBuilder = ({
  defaultMessage,
}) => defaultMessage;
const defaultNotificationFilter: NotificationAnnouncementFilter = () => true;

/**
 * Announces new notifications to assistive technology through {@link useAriaLiveAnnouncer}, paced
 * by {@link useAnnouncementQueue}. It renders no live region of its own, so it announces nothing
 * outside an `AriaLiveAnnouncerProvider` (which `Chat` mounts).
 */
export const NotificationAnnouncer = ({
  buildNotificationAnnouncement = defaultBuildNotificationAnnouncement,
  notificationFilter = defaultNotificationFilter,
}: NotificationAnnouncerProps) => {
  const { t } = useTranslationContext();
  const notifications = useNotifications();
  const announce = useAriaLiveAnnouncer();
  const { enqueue } = useAnnouncementQueue(announce);

  const initializedRef = useRef(false);
  const seenNotificationIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const visibleNotificationIds = new Set(notifications.map(({ id }) => id));

    seenNotificationIdsRef.current.forEach((id) => {
      if (!visibleNotificationIds.has(id)) {
        seenNotificationIdsRef.current.delete(id);
      }
    });

    // Do not announce notifications already present on first render.
    if (!initializedRef.current) {
      notifications.forEach(({ id }) => seenNotificationIdsRef.current.add(id));
      initializedRef.current = true;
      return;
    }

    notifications.forEach((notification) => {
      if (seenNotificationIdsRef.current.has(notification.id)) return;

      seenNotificationIdsRef.current.add(notification.id);
      if (!notificationFilter(notification)) return;

      const message = t('translationBuilderTopic.notification', {
        notification,
        value: notification.message,
      });

      if (!message) return;

      const defaultMessage = getDefaultAnnouncementMessage(notification, message);
      const announcementMessage = buildNotificationAnnouncement({
        defaultMessage,
        notification,
        translatedMessage: message,
      });

      if (!announcementMessage) return;

      enqueue({
        message: announcementMessage,
        priority: getAnnouncementPriority(notification),
      });
    });
  }, [buildNotificationAnnouncement, enqueue, notificationFilter, notifications, t]);

  return null;
};
