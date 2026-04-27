import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification } from 'stream-chat';

import { useNotifications } from '../Notifications';
import { VisuallyHidden } from '../VisuallyHidden';
import { useTranslationContext } from '../../context';

type LivePriority = 'assertive' | 'polite';

type QueuedAnnouncement = {
  id: string;
  message: string;
  priority: LivePriority;
};

export type NotificationAnnouncementBuilderParams = {
  defaultMessage: string;
  notification: Notification;
  translatedMessage: string;
};

export type NotificationAnnouncementBuilder = (
  params: NotificationAnnouncementBuilderParams,
) => string;
export type NotificationAnnouncementFilter = (notification: Notification) => boolean;

const ANNOUNCEMENT_CLEAR_DELAY_MS = 50;
const ANNOUNCEMENT_QUEUE_GAP_MS = 120;

const getAnnouncementPriority = (notification: Notification): LivePriority =>
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

export const NotificationAnnouncer = ({
  buildNotificationAnnouncement = defaultBuildNotificationAnnouncement,
  notificationFilter = defaultNotificationFilter,
}: NotificationAnnouncerProps) => {
  const { t } = useTranslationContext();
  const notifications = useNotifications();
  const [announcementQueue, setAnnouncementQueue] = useState<QueuedAnnouncement[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [politeAnnouncement, setPoliteAnnouncement] = useState('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState('');
  const initializedRef = useRef(false);
  const seenNotificationIdsRef = useRef(new Set<string>());
  const announceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dequeueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimeouts = useCallback(() => {
    if (announceTimeoutRef.current) {
      clearTimeout(announceTimeoutRef.current);
      announceTimeoutRef.current = null;
    }

    if (dequeueTimeoutRef.current) {
      clearTimeout(dequeueTimeoutRef.current);
      dequeueTimeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearTimeouts();
    },
    [clearTimeouts],
  );

  useEffect(() => {
    const visibleNotificationIds = new Set(notifications.map(({ id }) => id));

    seenNotificationIdsRef.current.forEach((id) => {
      if (!visibleNotificationIds.has(id)) {
        seenNotificationIdsRef.current.delete(id);
      }
    });

    if (!initializedRef.current) {
      notifications.forEach(({ id }) => {
        seenNotificationIdsRef.current.add(id);
      });
      initializedRef.current = true;
      return;
    }

    const nextAnnouncements: QueuedAnnouncement[] = [];

    notifications.forEach((notification) => {
      if (seenNotificationIdsRef.current.has(notification.id)) return;

      seenNotificationIdsRef.current.add(notification.id);
      if (!notificationFilter(notification)) return;

      const message = t('translationBuilderTopic/notification', {
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

      nextAnnouncements.push({
        id: notification.id,
        message: announcementMessage,
        priority: getAnnouncementPriority(notification),
      });
    });

    if (!nextAnnouncements.length) return;

    setAnnouncementQueue((currentQueue) => [...currentQueue, ...nextAnnouncements]);
  }, [buildNotificationAnnouncement, notificationFilter, notifications, t]);

  useEffect(() => {
    if (isAnnouncing) return;

    const nextAnnouncement = announcementQueue[0];
    if (!nextAnnouncement) return;

    setIsAnnouncing(true);
    clearTimeouts();
    setPoliteAnnouncement('');
    setAssertiveAnnouncement('');

    announceTimeoutRef.current = setTimeout(() => {
      if (nextAnnouncement.priority === 'assertive') {
        setAssertiveAnnouncement(nextAnnouncement.message);
      } else {
        setPoliteAnnouncement(nextAnnouncement.message);
      }

      dequeueTimeoutRef.current = setTimeout(() => {
        setAnnouncementQueue((currentQueue) =>
          currentQueue.filter(({ id }) => id !== nextAnnouncement.id),
        );
        setIsAnnouncing(false);
        dequeueTimeoutRef.current = null;
      }, ANNOUNCEMENT_QUEUE_GAP_MS);

      announceTimeoutRef.current = null;
    }, ANNOUNCEMENT_CLEAR_DELAY_MS);
  }, [announcementQueue, clearTimeouts, isAnnouncing]);

  return (
    <VisuallyHidden data-testid='notification-announcer'>
      <div aria-atomic='true' aria-live='polite' role='status'>
        {politeAnnouncement}
      </div>
      <div aria-atomic='true' aria-live='assertive' role='alert'>
        {assertiveAnnouncement}
      </div>
    </VisuallyHidden>
  );
};
