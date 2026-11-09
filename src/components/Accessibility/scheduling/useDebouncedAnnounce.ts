import { useCallback, useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type DebouncedAnnounceResult = {
  /**
   * Schedules an announcement under `key`. Each call on a key resets that key's timer, so only the
   * last call within its `delayMs` fires. Keys debounce independently, each with its own `delayMs`.
   */
  announce: (
    key: string,
    message: string,
    delayMs: number,
    priority?: AriaLivePriority,
  ) => void;
  /** Cancels the pending announcement of `key`, or all when omitted (also runs on unmount). */
  cancel: (key?: string) => void;
};

/**
 * Per-key debounce over `announce`: each `key` has an independent timer and each call its own
 * delay, so streams with different windows do not clobber one another. Use a constant key for a
 * single stream. Pending timers are cleared on unmount.
 *
 * The caller pushes each fresh value; rapid calls on a key collapse to the last one, so a changing
 * value is announced once per pause. For one fixed message per state change, use
 * {@link useSettledAnnouncement}.
 */
export const useDebouncedAnnounce = (
  announce: AriaLiveAnnounce,
): DebouncedAnnounceResult => {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Latest `announce` without changing the identity of the debounced callback.
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
