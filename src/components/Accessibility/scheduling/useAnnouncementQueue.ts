import { useCallback, useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type QueuedAnnouncement = {
  message: string;
  priority?: AriaLivePriority;
};

export type UseAnnouncementQueueOptions = {
  /** Minimum delay between successive announcements, in ms. Defaults to 150. */
  gapMs?: number;
};

export type UseAnnouncementQueueResult = {
  /** Enqueue an announcement. The first drains immediately; the rest are paced by `gapMs`. */
  enqueue: (announcement: QueuedAnnouncement) => void;
};

const DEFAULT_GAP_MS = 150;

/**
 * L2 scheduling policy: announce queued messages one at a time, spaced by `gapMs`, through the
 * provided `announce` (from `useAriaLiveAnnouncer`). Replaces per-consumer queue/timer
 * bookkeeping (e.g. the old `NotificationAnnouncer` state machine). The unified announcer already
 * appends a fresh node per call, so no "clear region first" trick is needed — the gap simply
 * prevents successive messages from clobbering each other in the screen-reader buffer.
 *
 * React 17/18/19 compatible — `useCallback`/`useRef`/`useEffect` only. Pending timers and the
 * queue are cleared on unmount.
 */
export const useAnnouncementQueue = (
  announce: AriaLiveAnnounce,
  { gapMs = DEFAULT_GAP_MS }: UseAnnouncementQueueOptions = {},
): UseAnnouncementQueueResult => {
  const queueRef = useRef<QueuedAnnouncement[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest `announce` without forcing `enqueue`/`drain` identity to change.
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const drain = useCallback(() => {
    if (timerRef.current) return; // already pacing — the running timer will drain the next item

    const next = queueRef.current.shift();
    if (!next) return;

    announceRef.current(next.message, { priority: next.priority });

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      drain();
    }, gapMs);
  }, [gapMs]);

  const enqueue = useCallback(
    (announcement: QueuedAnnouncement) => {
      queueRef.current.push(announcement);
      drain();
    },
    [drain],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      queueRef.current = [];
    },
    [],
  );

  return { enqueue };
};
