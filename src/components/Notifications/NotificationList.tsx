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
 * Selects the candidate notification to display. Receives the current store contents and
 * the currently displayed notification (or `null` when nothing is mounted). Returning
 * `displayed` (or any notification with the same id) means "no swap"; returning a
 * different notification triggers a swap (immediate or after `minDisplayMs`, see the
 * scheduling effect); returning `null` triggers the empty-slot exit.
 *
 * Default: `createDefaultPickNext(pickOldest)` — applies persistent-wins,
 * same-type-refresh and FIFO queue rules from the design spec. Pass
 * `pickNext={createDefaultPickNext(pickNewest)}` to swap FIFO for LIFO without
 * reimplementing those rules, or your own `pickNext` to opt out entirely.
 */
export type PickNextNotification = (
  notifications: Notification[],
  displayed: Notification | null,
) => Notification | null;

/**
 * Picks the next queued notification when no higher-priority rule applies (persistent
 * wins, same-type refresh). Used by `createDefaultPickNext`.
 */
export type PickFromQueue = (
  notifications: Notification[],
  displayed: Notification | null,
) => Notification | null;

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
  /**
   * Minimum time in milliseconds the active notification stays visible before a queued one
   * can replace it. Replacements scheduled while the dwell window is open wait until it has
   * elapsed; arrivals after that window replace the active notification immediately.
   * Same-type repeated triggers and external dismissals bypass this dwell.
   * Defaults to 1000ms.
   */
  minDisplayMs?: number;
  /**
   * Override the candidate-selection policy. The function decides which notification
   * should be displayed given the store and the currently displayed one. Defaults to
   * `createDefaultPickNext(pickOldest)`. Pass `createDefaultPickNext(pickNewest)` for LIFO.
   */
  pickNext?: PickNextNotification;
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

/** FIFO queue selector — oldest `createdAt` other than `displayed` wins. */
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

/** LIFO queue selector — newest `createdAt` other than `displayed` wins. */
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
 * Builds the default `PickNextNotification` selector with a configurable queue fallback.
 * Encodes the snackbar concurrency rules from the design spec — the scheduling effect
 * only decides *when* to swap, the returned function decides *what* to swap to.
 *
 * Rules, in order of precedence:
 *   1. **Persistent wins.** Persistent variants (no `duration`) jump ahead of any
 *      queued transient because they carry an action the user must acknowledge.
 *   2. **Persistent ↛ replaced by transient.** While a persistent is displayed it stays
 *      put until dismissed externally or a *newer* persistent arrives.
 *   3. **Same-type refresh.** While a transient is displayed, a repeated trigger of the
 *      same `type` collapses to its latest occurrence. (The scheduling effect detects
 *      this via `haveSameType` and bypasses the dwell window so the refresh feels
 *      instant; this function just makes sure the latest same-type is returned.)
 *   4. **Queue fallback.** Otherwise, `pickFromQueue` selects the next notification
 *      (default: `pickOldest` / FIFO).
 *
 * Exported so callers that want to layer behavior on top of the design rules can wrap
 * the result instead of rewriting it.
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
      // Currently showing a persistent: only a newer persistent can replace it. Reuse the
      // earlier lookup when it already points at a different persistent.
      const newerPersistent =
        newestPersistent && newestPersistent.id !== displayed.id
          ? newestPersistent
          : pickNewestPersistent(notifications, displayed.id);
      if (newerPersistent && newerPersistent.createdAt > displayed.createdAt) {
        return newerPersistent;
      }
      return displayed;
    }

    // Currently showing a transient.
    // 1. Same-type "refresh of current" wins immediately — a repeated trigger of the
    //    displayed snackbar collapses to the latest occurrence of that type.
    const sameTypeNewest = pickNewestOfType(notifications, displayed.type, displayed.id);
    if (sameTypeNewest) return sameTypeNewest;

    // 2. Any queued persistent jumps ahead of the queue.
    if (newestPersistent) return newestPersistent;

    // 3. Queue fallback.
    return pickFromQueue(notifications, displayed) ?? displayed;
  };

/** Default selector — design-spec rules with FIFO queue fallback (`pickOldest`). */
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
  const { removeNotification, startNotificationTimeout } = useNotificationApi();
  // Holds the timer that runs the exit animation. Set when we flip `transitionState` to
  // `'exit'`; when it fires, the previously displayed notification is removed and either the
  // next candidate is mounted (entering) or the list collapses to empty. Only one exit
  // animation can be in flight at a time.
  const exitTimeoutRef = useRef<number | null>(null);
  // Holds the dwell timer that defers a swap until `minDisplayMs` has elapsed since the
  // active notification became visible. It only exists while we're waiting out the dwell
  // window; same-type triggers, external dismissals and arrivals after the dwell window
  // bypass it and trigger the exit animation directly.
  const replacementTimeoutRef = useRef<number | null>(null);
  const candidateRef = useRef<Notification | null>(null);
  const displayedAtRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const observedElementRef = useRef<HTMLDivElement | null>(null);
  const startedTimeoutIdsRef = useRef<Set<string> | null>(null);

  if (!startedTimeoutIdsRef.current) {
    startedTimeoutIdsRef.current = new Set<string>();
  }

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
      startedTimeoutIdsRef.current?.delete(id);
      removeNotification(id);
    },
    [removeNotification],
  );

  // Drop any stale entries from the started-timeouts set whenever the store changes.
  useEffect(() => {
    const notificationIds = new Set(notifications.map(({ id }) => id));

    startedTimeoutIdsRef.current?.forEach((id) => {
      if (!notificationIds.has(id)) {
        startedTimeoutIdsRef.current?.delete(id);
      }
    });
  }, [notifications]);

  const clearReplacementTimeout = useCallback(() => {
    if (replacementTimeoutRef.current !== null) {
      window.clearTimeout(replacementTimeoutRef.current);
      replacementTimeoutRef.current = null;
    }
  }, []);

  // Cleanup pending timers on unmount.
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

  // Keep the freshest candidate around so swap completion can read the latest value, even
  // when a new notification arrives mid-exit-animation.
  useEffect(() => {
    candidateRef.current = pickNext(notifications, displayedNotification);
  }, [displayedNotification, notifications, pickNext]);

  // Main scheduling effect — owns *when* swaps happen. The *what* is delegated entirely
  // to `pickNext` (default: `createDefaultPickNext(pickOldest)`).
  //
  // Runs on every change to `displayedNotification`, `notifications`, `pickNext`, or
  // `transitionState`, and decides one of four outcomes:
  //   1. Do nothing (the right notification is already on screen, or an exit animation
  //      is mid-flight and will re-trigger this effect when it finishes).
  //   2. Mount the first notification (no `displayedNotification` yet).
  //   3. Unmount the current one (`pickNext` returned `null`, the store became empty).
  //   4. Swap the displayed one for the new candidate — either immediately or after the
  //      `minDisplayMs` dwell window has elapsed.
  //
  // Timing rules applied here (independent of selection policy):
  //   - **Dwell window.** When `pickNext` returns a different candidate, hold the active
  //     notification on screen until at least `minDisplayMs` has passed since it became
  //     visible. Replacements that arrive after that window swap immediately.
  //   - **Same-type bypass.** If the candidate has the same `type` as the displayed
  //     notification, swap immediately (no dwell) — this is the "repeated trigger
  //     refreshes the snackbar and resets the auto-dismiss timer" behavior. The timer
  //     reset is achieved by removing the previously displayed notification on swap
  //     (which clears its `NotificationManager` timer) so the new one starts its own
  //     when it next intersects the slot.
  //   - **External-dismiss bypass.** If the displayed notification is no longer in the
  //     store (user clicked the close button, `NotificationManager` auto-removed it,
  //     etc.), swap immediately — we should not stall an empty slot for the dwell.
  useEffect(() => {
    // An exit animation is already in flight. Once its timer fires it sets new state
    // (either the next notification or `null`), which will re-run this effect from a
    // clean baseline.
    if (transitionState === 'exit') return;

    // No notification is mounted yet — pick whatever the candidate logic prefers and
    // mount it directly with an enter animation. No swap required.
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

    // The store has been drained while a notification was visible. Play the exit
    // animation, then unmount.
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

    // The candidate is the displayed notification itself — nothing to do. Cancel any
    // dwell timer that may have been queued by an earlier run that has since become
    // moot (e.g. the incoming notification was removed before its dwell expired).
    if (candidate.id === displayedNotification.id) {
      clearReplacementTimeout();
      return;
    }

    const displayedInStore = notifications.some(
      ({ id }) => id === displayedNotification.id,
    );

    // Swap routine shared by the immediate and dwell-deferred branches below. Captures
    // `previousId` / `wasInStore` from the effect's closure so the exit timer can run
    // the right cleanup even if state has moved on by the time it fires.
    const startSwap = () => {
      replacementTimeoutRef.current = null;
      setTransitionState('exit');
      const previousId = displayedNotification.id;
      const wasInStore = displayedInStore;
      exitTimeoutRef.current = window.setTimeout(() => {
        exitTimeoutRef.current = null;
        if (wasInStore) {
          // Remove the previously displayed notification from the store so it does not
          // re-appear, and so its NotificationManager auto-dismiss timer is cleared.
          startedTimeoutIdsRef.current?.delete(previousId);
          removeNotification(previousId);
        }
        // Read the latest candidate at the moment the exit animation actually completes —
        // it may differ from the one decided when `startSwap` was queued because new
        // notifications could have arrived during the 340ms exit window.
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

    // External dismissal or auto-dismiss removed the displayed notification: swap right
    // away (no dwell wait — the slot would otherwise stall empty for `minDisplayMs`).
    if (!displayedInStore) {
      clearReplacementTimeout();
      startSwap();
      return;
    }

    // Repeated triggers of the same snackbar replace the active one and reset the
    // auto-dismiss timer immediately — feedback for the same condition should feel like
    // a single, persistent thing being refreshed.
    if (haveSameType(displayedNotification, candidate)) {
      clearReplacementTimeout();
      startSwap();
      return;
    }

    // Default branch: enforce the dwell window. `displayedAtRef` is stamped synchronously
    // every time we set `displayedNotification` (initial mount and swap completion), so it
    // is in sync with what is on screen by the time this effect runs.
    const elapsed = displayedAtRef.current ? Date.now() - displayedAtRef.current : 0;
    const remaining = Math.max(0, minDisplayMs - elapsed);

    if (remaining === 0) {
      // Dwell already elapsed; swap right now.
      clearReplacementTimeout();
      startSwap();
    } else if (replacementTimeoutRef.current === null) {
      // A swap is pending but the dwell hasn't elapsed yet. Schedule the swap once —
      // subsequent re-runs of this effect (e.g. as even newer notifications arrive)
      // intentionally do NOT reschedule. `candidateRef` keeps tracking the freshest
      // candidate, so when the timer fires `startSwap` → exit completes → the latest
      // candidate is picked up automatically.
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

    const startTimeout = () => {
      if (
        !startedTimeoutIdsRef.current ||
        startedTimeoutIdsRef.current.has(notification.id)
      )
        return;

      startedTimeoutIdsRef.current.add(notification.id);
      startNotificationTimeout(notification.id);
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
  }, [notification, startNotificationTimeout, transitionState]);

  if (!notification) return null;

  return (
    <div
      aria-label={t('aria/Notifications')}
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
