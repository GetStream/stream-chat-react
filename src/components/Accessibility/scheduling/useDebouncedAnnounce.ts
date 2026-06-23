import { useCallback, useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type UseDebouncedAnnounceResult = {
  /** Schedule an announcement; each call resets the timer so only the last within `delayMs` fires. */
  announce: (message: string, priority?: AriaLivePriority) => void;
  /** Cancel a pending announcement (also runs automatically on unmount). */
  cancel: () => void;
};

/**
 * L2 scheduling policy: debounce announcements through the provided `announce` (from
 * `useAriaLiveAnnouncer`). Use for a rapidly-updating stream where only the settled value
 * should be read — e.g. the autocomplete result count as the query filters. Discrete,
 * must-be-immediate announcements (e.g. "Giphy sent") should NOT be debounced.
 *
 * React 17/18/19 compatible — `useCallback`/`useRef`/`useEffect` only. The pending timer is
 * cleared on unmount.
 */
export const useDebouncedAnnounce = (
  announce: AriaLiveAnnounce,
  delayMs: number,
): UseDebouncedAnnounceResult => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest `announce` without changing the debounced callback identity.
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const debouncedAnnounce = useCallback(
    (message: string, priority?: AriaLivePriority) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        announceRef.current(message, priority);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  return { announce: debouncedAnnounce, cancel };
};
