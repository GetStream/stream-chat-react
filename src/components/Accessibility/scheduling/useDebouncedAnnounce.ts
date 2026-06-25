import { useCallback, useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type DebouncedAnnounceResult = {
  /**
   * Schedule an announcement on the channel identified by `key`. Each call on the same key
   * resets that key's timer, so only the last call within its `delayMs` fires. Different keys
   * debounce independently — scheduling key `a` never cancels a pending key `b`, and each may
   * use its own `delayMs`.
   */
  announce: (
    key: string,
    message: string,
    delayMs: number,
    priority?: AriaLivePriority,
  ) => void;
  /** Cancel pending announcement(s): a single `key`, or all when omitted (also runs on unmount). */
  cancel: (key?: string) => void;
};

/**
 * L2 scheduling policy: a per-key debounce over the provided `announce` (from
 * `useAriaLiveAnnouncer`). Keeps an independent timer per `key` and takes the delay per call, so
 * distinct rapidly-updating streams can coexist with different debounce windows without clobbering
 * one another (e.g. the autocomplete count, which is a consequence of typing and wants a longer
 * window to clear the screen reader's typing echo, vs. some other future debounced stream). For a
 * single stream, use a constant key.
 *
 * React 17/18/19 compatible — `useCallback`/`useRef`/`useEffect` only. All pending timers are
 * cleared on unmount.
 */
export const useDebouncedAnnounce = (
  announce: AriaLiveAnnounce,
): DebouncedAnnounceResult => {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Keep the latest `announce` without changing the debounced callback identity.
  const announceRef = useRef(announce);
  announceRef.current = announce;

  const cancel = useCallback((key?: string) => {
    const timers = timersRef.current;
    if (key === undefined) {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
      return;
    }
    const timerId = timers.get(key);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timers.delete(key);
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const debouncedAnnounce = useCallback(
    (key: string, message: string, delayMs: number, priority?: AriaLivePriority) => {
      const timers = timersRef.current;
      const existing = timers.get(key);
      if (existing !== undefined) clearTimeout(existing);
      const timerId = setTimeout(() => {
        timers.delete(key);
        announceRef.current(message, { priority });
      }, delayMs);
      timers.set(key, timerId);
    },
    [],
  );

  return { announce: debouncedAnnounce, cancel };
};
