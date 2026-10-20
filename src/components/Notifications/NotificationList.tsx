import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Notification } from 'stream-chat';

import { hasSystemNotificationTag, useNotificationApi } from './hooks/useNotificationApi';
import { useNotifications } from './hooks/useNotifications';
import { Notification as DefaultNotification } from './Notification';
import { useComponentContext, useTranslationContext } from '../../context';

import type { NotificationTargetPanel } from './notificationTarget';

export type NotificationListFilter = (notification: Notification) => boolean;
export type NotificationListEnterFrom = 'bottom' | 'left' | 'right' | 'top';
export type NotificationListVerticalAlignment = 'bottom' | 'top';
/**
 * Selects the notification to display, given the store contents and the displayed notification
 * (`null` when nothing is mounted). Returning `displayed` or a notification with the same ID keeps
 * the current one, a different notification triggers a swap (immediate or after `minDisplayMs`),
 * and `null` triggers the empty-slot exit.
 */
export type PickNextNotification = (
  notifications: Notification[],
  displayed: Notification | null,
) => Notification | null;

/** Queue fallback of `createDefaultPickNext`, used when none of its other rules applies. */
export type PickFromQueue = (
  notifications: Notification[],
  displayed: Notification | null,
) => Notification | null;

export type NotificationListProps = {
  /** Class applied to the list container. */
  className?: string;
  /**
   * Direction from which a replacement enters the visible slot. Defaults to `bottom`. An
   * `entryDirection` in the notification's `metadata` or `origin.context` takes precedence.
   */
  enterFrom?: NotificationListEnterFrom;
  /**
   * Limits the list to notifications that pass the filter, e.g. by `origin.emitter`,
   * `origin.context` or `metadata`. System banners are always excluded.
   */
  filter?: NotificationListFilter;
  /**
   * Minimum time (ms) the active notification stays visible before a queued one replaces it.
   * Same-type repeats and external dismissals bypass it. Defaults to 1000.
   */
  minDisplayMs?: number;
  /**
   * Overrides which notification is displayed, given the store and the displayed one. Defaults to
   * `createDefaultPickNext(pickOldest)`; pass `createDefaultPickNext(pickNewest)` for LIFO.
   */
  pickNext?: PickNextNotification;
  /** Panel target consumed by this list. */
  panel?: NotificationTargetPanel;
  /** Panel assumed for notifications that name none. Defaults to `channel`. */
  fallbackPanel?: NotificationTargetPanel;
  /** Vertical alignment of the single notification slot within its parent. Defaults to `bottom`. */
  verticalAlignment?: NotificationListVerticalAlignment;
};

// Entry motion goes through CSS variables so one keyframe is shared in SCSS. Full-size percentages
// on the active axis slide a replacement in from outside its slot.
const ENTER_TRANSLATION: Record<NotificationListEnterFrom, { x: string; y: string }> = {
  bottom: { x: '0%', y: '100%' },
  left: { x: '-100%', y: '0%' },
  right: { x: '100%', y: '0%' },
  top: { x: '0%', y: '-100%' },
};

const EXIT_ANIMATION_MS = 340;
const DEFAULT_MIN_DISPLAY_MS = 1000;

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

const isPersistent = (notification: Notification) => !notification.duration;

const haveSameType = (a: Notification | null, b: Notification | null) =>
  !!a?.type && !!b?.type && a.type === b.type;

/** FIFO queue selector: the oldest notification (by `createdAt`) other than `displayed`. */
export const pickOldest: PickFromQueue = (notifications, displayed) => {
  const excludeId = displayed?.id ?? null;
  let oldest: Notification | null = null;
  for (const notification of notifications) {
    if (notification.id === excludeId) continue;
    if (!oldest || notification.createdAt < oldest.createdAt) {
      oldest = notification;
    }
  }
  return oldest;
};

/** LIFO queue selector: the newest notification (by `createdAt`) other than `displayed`. */
export const pickNewest: PickFromQueue = (notifications, displayed) => {
  const excludeId = displayed?.id ?? null;
  let newest: Notification | null = null;
  for (const notification of notifications) {
    if (notification.id === excludeId) continue;
    if (!newest || notification.createdAt > newest.createdAt) {
      newest = notification;
    }
  }
  return newest;
};

const pickNewestPersistent = (
  notifications: Notification[],
  excludeId: string | null,
): Notification | null => {
  let newest: Notification | null = null;
  for (const notification of notifications) {
    if (notification.id === excludeId) continue;
    if (!isPersistent(notification)) continue;
    if (!newest || notification.createdAt > newest.createdAt) {
      newest = notification;
    }
  }
  return newest;
};

const pickNewestOfType = (
  notifications: Notification[],
  type: string | undefined | null,
  excludeId: string | null,
): Notification | null => {
  if (!type) return null;
  let newest: Notification | null = null;
  for (const notification of notifications) {
    if (notification.id === excludeId) continue;
    if (notification.type !== type) continue;
    if (!newest || notification.createdAt > newest.createdAt) {
      newest = notification;
    }
  }
  return newest;
};

/**
 * Builds the default `PickNextNotification` selector with a configurable queue fallback. The
 * scheduling effect in `NotificationList` decides when to swap, the selector what to swap to. It
 * returns `null` for an empty store, otherwise:
 *
 * - Nothing displayed, or the displayed one left the store: the newest persistent notification (no
 *   `duration`), else `pickFromQueue`.
 * - A persistent is displayed: it stays until a newer persistent arrives or it is dismissed.
 * - A transient is displayed: the newest other notification of the same `type`, else the newest
 *   persistent, else `pickFromQueue`, else the displayed one.
 *
 * @param pickFromQueue - Queue fallback. Defaults to `pickOldest`.
 * @returns The selector.
 */
export const createDefaultPickNext =
  (pickFromQueue: PickFromQueue = pickOldest): PickNextNotification =>
  (notifications, displayed) => {
    if (notifications.length === 0) return null;

    const newestPersistent = pickNewestPersistent(notifications, null);

    if (!displayed) {
      return newestPersistent ?? pickFromQueue(notifications, null);
    }

    const displayedInStore = notifications.some(({ id }) => id === displayed.id);
    if (!displayedInStore) {
      return newestPersistent ?? pickFromQueue(notifications, null);
    }

    if (isPersistent(displayed)) {
      // Only a newer persistent can replace it. Reuse the earlier lookup when it already points at
      // a different persistent.
      const newerPersistent =
        newestPersistent && newestPersistent.id !== displayed.id
          ? newestPersistent
          : pickNewestPersistent(notifications, displayed.id);
      if (newerPersistent && newerPersistent.createdAt > displayed.createdAt) {
        return newerPersistent;
      }
      return displayed;
    }

    // A transient is displayed. A repeat of its type collapses to the latest occurrence.
    const sameTypeNewest = pickNewestOfType(notifications, displayed.type, displayed.id);
    if (sameTypeNewest) return sameTypeNewest;

    // A queued persistent jumps ahead of the queue.
    if (newestPersistent) return newestPersistent;

    return pickFromQueue(notifications, displayed) ?? displayed;
  };

/** Default selector: the rules of `createDefaultPickNext` with a FIFO queue fallback. */
const defaultPickNext = createDefaultPickNext(pickOldest);

export const NotificationList = ({
  className,
  enterFrom = 'bottom',
  fallbackPanel,
  filter,
  minDisplayMs = DEFAULT_MIN_DISPLAY_MS,
  panel,
  pickNext = defaultPickNext,
  verticalAlignment = 'bottom',
}: NotificationListProps) => {
  const { Notification: NotificationComponent = DefaultNotification } =
    useComponentContext();
  const { t } = useTranslationContext();
  const { ensureNotificationTimeout, removeNotification } = useNotificationApi();
  // Timer of the exit animation, set when `transitionState` flips to `'exit'`. When it fires, the
  // next candidate mounts or the slot empties. At most one exit animation is in flight.
  const exitTimeoutRef = useRef<number | null>(null);
  // Dwell timer that defers a swap until `minDisplayMs` has passed since the active notification
  // became visible. It exists only while waiting; same-type repeats, external dismissals and
  // arrivals after the dwell window start the exit directly.
  const replacementTimeoutRef = useRef<number | null>(null);
  const candidateRef = useRef<Notification | null>(null);
  const displayedAtRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const observedElementRef = useRef<HTMLDivElement | null>(null);

  const [displayedNotification, setDisplayedNotification] = useState<Notification | null>(
    null,
  );
  const [transitionState, setTransitionState] = useState<'enter' | 'exit'>('enter');
  const combinedFilter = useCallback(
    (notification: Notification) => {
      if (hasSystemNotificationTag(notification)) return false;
      return filter ? filter(notification) : true;
    },
    [filter],
  );
  const notifications = useNotifications({
    applyDisplayFilter: true,
    fallbackPanel,
    filter: combinedFilter,
    panel,
  });

  const dismiss = useCallback(
    (id: string) => {
      removeNotification(id);
    },
    [removeNotification],
  );

  const clearReplacementTimeout = useCallback(() => {
    if (replacementTimeoutRef.current !== null) {
      window.clearTimeout(replacementTimeoutRef.current);
      replacementTimeoutRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearReplacementTimeout();
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    },
    [clearReplacementTimeout],
  );

  // Tracks the freshest candidate so swap completion reads the latest one, even when a
  // notification arrives mid-exit.
  useEffect(() => {
    candidateRef.current = pickNext(notifications, displayedNotification);
  }, [displayedNotification, notifications, pickNext]);

  // Scheduling effect: decides when to swap, while `pickNext` decides what to swap to. A swap waits
  // until the active notification has been visible for `minDisplayMs`, except for a same-type
  // repeat and for a displayed notification that already left the store.
  useEffect(() => {
    // An exit is in flight; its timer sets new state, which re-runs this effect.
    if (transitionState === 'exit') return;

    // Nothing is mounted yet: mount the candidate directly.
    if (!displayedNotification) {
      const candidate = pickNext(notifications, null);
      if (candidate) {
        displayedAtRef.current = Date.now();
        setDisplayedNotification(candidate);
        setTransitionState('enter');
      }
      return;
    }

    const candidate = pickNext(notifications, displayedNotification);

    // No candidate (e.g. the store was drained): play the exit animation, then unmount.
    if (!candidate) {
      clearReplacementTimeout();
      setTransitionState('exit');
      exitTimeoutRef.current = window.setTimeout(() => {
        exitTimeoutRef.current = null;
        displayedAtRef.current = null;
        setDisplayedNotification(null);
        setTransitionState('enter');
      }, EXIT_ANIMATION_MS);
      return;
    }

    // The candidate is already displayed. Cancel a dwell timer queued by an earlier run that became
    // moot (e.g. the incoming notification was removed before its dwell expired).
    if (candidate.id === displayedNotification.id) {
      clearReplacementTimeout();
      return;
    }

    const displayedInStore = notifications.some(
      ({ id }) => id === displayedNotification.id,
    );

    // Shared by the immediate and dwell-deferred branches below. `previousId` and `wasInStore` are
    // captured so the exit timer cleans up correctly even if state has moved on by then.
    const startSwap = () => {
      replacementTimeoutRef.current = null;
      setTransitionState('exit');
      const previousId = displayedNotification.id;
      const wasInStore = displayedInStore;
      exitTimeoutRef.current = window.setTimeout(() => {
        exitTimeoutRef.current = null;
        if (wasInStore) {
          // Removing it keeps it from re-appearing and clears its auto-dismiss timer.
          removeNotification(previousId);
        }
        // Reads the latest candidate when the exit completes; it may differ from the one chosen
        // when the swap was queued, as notifications can arrive during the exit window.
        const next = candidateRef.current;
        if (next && next.id !== previousId) {
          displayedAtRef.current = Date.now();
          setDisplayedNotification(next);
          setTransitionState('enter');
        } else {
          displayedAtRef.current = null;
          setDisplayedNotification(null);
          setTransitionState('enter');
        }
      }, EXIT_ANIMATION_MS);
    };

    // The displayed notification was dismissed or auto-dismissed: swap right away rather than
    // stall the empty slot for `minDisplayMs`.
    if (!displayedInStore) {
      clearReplacementTimeout();
      startSwap();
      return;
    }

    // A repeat of the same type replaces the active notification immediately, and the new one
    // starts its own auto-dismiss countdown.
    if (haveSameType(displayedNotification, candidate)) {
      clearReplacementTimeout();
      startSwap();
      return;
    }

    // Default branch: enforce the dwell window. `displayedAtRef` is stamped whenever
    // `displayedNotification` is set, so it matches what is on screen.
    const elapsed = displayedAtRef.current ? Date.now() - displayedAtRef.current : 0;
    const remaining = Math.max(0, minDisplayMs - elapsed);

    if (remaining === 0) {
      clearReplacementTimeout();
      startSwap();
    } else if (replacementTimeoutRef.current === null) {
      // Scheduled once: re-runs (e.g. even newer arrivals) do not reschedule, since `candidateRef`
      // keeps tracking the freshest candidate for when the exit completes.
      replacementTimeoutRef.current = window.setTimeout(startSwap, remaining);
    }
  }, [
    clearReplacementTimeout,
    displayedNotification,
    minDisplayMs,
    notifications,
    pickNext,
    removeNotification,
    transitionState,
  ]);

  const notification = displayedNotification;
  const notificationEnterFrom = getNotificationEnterFrom(notification, enterFrom);

  useEffect(() => {
    const element = observedElementRef.current;
    if (!element || !notification || transitionState === 'exit') return;

    // `ensureTimeout` leaves a running countdown alone, so this can run whenever the notification
    // becomes visible without tracking which ones were started.
    const startTimeout = () => {
      ensureNotificationTimeout(notification.id);
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
  }, [ensureNotificationTimeout, notification, transitionState]);

  if (!notification) return null;

  return (
    <div
      aria-label={t('notification.list.notifications.ariaLabel', 'Notifications')}
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
