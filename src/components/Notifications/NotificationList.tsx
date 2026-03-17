import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Notification } from 'stream-chat';

import { useChatContext } from '../../context';
import { useNotifications } from './hooks/useNotifications';
import { Notification as NotificationComponent } from './Notification';

import type { NotificationTargetPanel } from './notificationTarget';

export type NotificationListFilter = (notification: Notification) => boolean;
export type NotificationListEnterFrom = 'bottom' | 'left' | 'right' | 'top';
export type NotificationListVerticalAlignment = 'bottom' | 'top';

export type NotificationListProps = {
  /** Optional class name for the list container */
  className?: string;
  /**
   * Direction from which the replacement notification enters the single visible slot.
   * Travel distance is configured in `ENTER_TRANSLATION` below.
   */
  enterFrom?: NotificationListEnterFrom;
  /**
   * When provided, this list only shows notifications that pass the filter.
   * Use to declare which notifications this list consumes (e.g. by origin.emitter, origin.context.channelId, or metadata).
   */
  filter?: NotificationListFilter;
  /** Panel target consumed by this list. */
  panel?: NotificationTargetPanel;
  /** Fallback panel when emitted notifications do not include origin.context.panel. */
  fallbackPanel?: NotificationTargetPanel;
  /** Vertical alignment of the single notification slot within its parent. Defaults to `bottom`. */
  verticalAlignment?: NotificationListVerticalAlignment;
};

// Entry motion is controlled through CSS variables so the keyframe can stay shared in SCSS.
// Use full-size percentages on the active axis to make a replacement notification slide in
// from outside its slot. If future tuning needs more travel, prefer `calc(100% + gap)` here.
const ENTER_TRANSLATION: Record<NotificationListEnterFrom, { x: string; y: string }> = {
  bottom: { x: '0%', y: '100%' },
  left: { x: '-100%', y: '0%' },
  right: { x: '100%', y: '0%' },
  top: { x: '0%', y: '-100%' },
};

const EXIT_ANIMATION_MS = 340;

const isEnterFrom = (value: unknown): value is NotificationListEnterFrom =>
  value === 'bottom' || value === 'left' || value === 'right' || value === 'top';

const getNotificationEnterFrom = (
  notification: Notification | null,
  fallbackEnterFrom: NotificationListEnterFrom,
) => {
  if (!notification) return fallbackEnterFrom;

  const metadataEnterFrom = notification.metadata?.entryDirection;
  if (isEnterFrom(metadataEnterFrom)) return metadataEnterFrom;

  const originEnterFrom = notification.origin.context?.entryDirection;
  if (isEnterFrom(originEnterFrom)) return originEnterFrom;

  return fallbackEnterFrom;
};

export const NotificationList = ({
  className,
  enterFrom = 'bottom',
  fallbackPanel,
  filter,
  panel,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { client } = useChatContext();
  const exitTimeoutRef = useRef<number | null>(null);
  const latestNotificationRef = useRef<Notification | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const observedElementRef = useRef<HTMLDivElement | null>(null);
  const startedTimeoutIdsRef = useRef(new Set<string>());
  const [displayedNotification, setDisplayedNotification] = useState<Notification | null>(
    null,
  );
  const [transitionState, setTransitionState] = useState<'enter' | 'exit'>('enter');
  const notifications = useNotifications({ fallbackPanel, filter, panel });
  const nextNotification = notifications[0] ?? null;

  const dismiss = useCallback(
    (id: string) => {
      startedTimeoutIdsRef.current.delete(id);
      client.notifications.remove(id);
    },
    [client],
  );

  useEffect(() => {
    const notificationIds = new Set(notifications.map(({ id }) => id));

    startedTimeoutIdsRef.current.forEach((id) => {
      if (!notificationIds.has(id)) {
        startedTimeoutIdsRef.current.delete(id);
      }
    });
  }, [notifications]);

  useEffect(() => {
    latestNotificationRef.current = nextNotification;
  }, [nextNotification]);

  useEffect(
    () => () => {
      if (exitTimeoutRef.current) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!displayedNotification) {
      if (!nextNotification) return;

      setDisplayedNotification(nextNotification);
      setTransitionState('enter');
      return;
    }

    if (displayedNotification.id === nextNotification?.id) return;
    if (transitionState === 'exit') return;

    setTransitionState('exit');
    exitTimeoutRef.current = window.setTimeout(() => {
      setDisplayedNotification(latestNotificationRef.current);
      setTransitionState('enter');
      exitTimeoutRef.current = null;
    }, EXIT_ANIMATION_MS);
  }, [displayedNotification, nextNotification, transitionState]);

  const notification = displayedNotification;
  const notificationEnterFrom = getNotificationEnterFrom(notification, enterFrom);

  useEffect(() => {
    const element = observedElementRef.current;
    if (!element || !notification || transitionState === 'exit') return;

    const startTimeout = () => {
      if (startedTimeoutIdsRef.current.has(notification.id)) return;

      startedTimeoutIdsRef.current.add(notification.id);
      client.notifications.startTimeout(notification.id);
    };

    if (typeof IntersectionObserver === 'undefined') {
      startTimeout();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;

        startTimeout();
        observer.disconnect();
      },
      {
        root: listRef.current,
        threshold: 0.5,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [client, notification, transitionState]);

  if (!notification) return null;

  return (
    <div
      aria-label='Notifications'
      className={clsx(
        'str-chat__notification-list',
        `str-chat__notification-list--enter-from-${notificationEnterFrom}`,
        `str-chat__notification-list--position-${verticalAlignment}`,
        panel && `str-chat__notification-list--${panel}`,
        className,
      )}
      data-testid='notification-list'
      ref={listRef}
      role='region'
      style={
        {
          '--str-chat__notification-list-enter-x':
            ENTER_TRANSLATION[notificationEnterFrom].x,
          '--str-chat__notification-list-enter-y':
            ENTER_TRANSLATION[notificationEnterFrom].y,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className='str-chat__notification-list__edge str-chat__notification-list__edge--top'
      />
      <NotificationComponent
        entryDirection={notificationEnterFrom}
        key={notification.id}
        notification={notification}
        onDismiss={() => dismiss(notification.id)}
        ref={(element) => {
          observedElementRef.current = element;
        }}
        showClose={!notification.duration}
        transitionState={transitionState}
      />
      <div
        aria-hidden
        className='str-chat__notification-list__edge str-chat__notification-list__edge--bottom'
      />
    </div>
  );
};
