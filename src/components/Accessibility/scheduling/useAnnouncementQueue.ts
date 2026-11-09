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
  /** Enqueues an announcement. The first drains immediately; the rest are paced by `gapMs`. */
  enqueue: (announcement: QueuedAnnouncement) => void;
};

const DEFAULT_GAP_MS = 150;

/**
 * Announces queued messages one at a time through `announce`, spaced by `gapMs` so successive
 * messages do not clobber each other in the screen-reader buffer. Pending timers and the queue are
 * cleared on unmount.
 */
export const useAnnouncementQueue = (
  announce: AriaLiveAnnounce,
  { gapMs = DEFAULT_GAP_MS }: UseAnnouncementQueueOptions = {},
): UseAnnouncementQueueResult => {
  const queueRef = useRef<QueuedAnnouncement[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest `announce` without changing the identity of `enqueue` and `drain`.
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const drain = useCallback(() => {
    if (timerRef.current) return; // The running timer drains the next item.

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
