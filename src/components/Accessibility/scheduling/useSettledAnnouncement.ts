import { useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type UseSettledAnnouncementParams = {
  /**
   * While `true`, the announcement is (re)scheduled. Going back to `false` resets the announced
   * state, so the message can fire again the next time `active` becomes `true`.
   */
  active: boolean;
  /** The message to announce; the latest value is used when it fires. */
  message: string;
  /**
   * A value whose identity changes while the surrounding UI is still in motion. Every change
   * restarts the idle timer. It must be stable between changes: an immutably updated array or
   * string works, a fresh object literal each render resets the timer forever.
   */
  settleKey: unknown;
  /** Idle window (ms) `settleKey` must stay unchanged before announcing. Defaults to `1500`. */
  idleMs?: number;
  /**
   * Announces at most once per `active` epoch. When `false`, it announces again each time it
   * settles while still active. Defaults to `true`.
   */
  once?: boolean;
  /** Live-region priority. Defaults to `'polite'`. */
  priority?: AriaLivePriority;
};

/**
 * Announces a message once the surrounding UI has gone idle. An immediate live-region update can
 * be superseded by the screen reader's own speech (typing echo, field re-read), so each change of
 * `settleKey` restarts an idle timer and the message fires only after the user has paused.
 *
 * `active` is the condition that makes the announcement relevant. With the default `once`, it fires
 * once per `active` epoch and re-arms when `active` goes false. For a changing value announced
 * repeatedly, use {@link useDebouncedAnnounce}. The pending timer is cleared on unmount.
 */
export const useSettledAnnouncement = (
  announce: AriaLiveAnnounce,
  {
    active,
    idleMs = 1500,
    message,
    once = true,
    priority = 'polite',
    settleKey,
  }: UseSettledAnnouncementParams,
) => {
  const announcedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Latest `announce` and `message` without resetting the idle timer; only `settleKey` does that.
  const announceRef = useRef(announce);
  announceRef.current = announce;
  const messageRef = useRef(message);
  messageRef.current = message;

  useEffect(() => {
    const clearPending = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    if (!active) {
      announcedRef.current = false;
      clearPending();
      return;
    }

    if (once && announcedRef.current) return;

    // Every `settleKey` change restarts the timer, so the message lands after activity stops.
    clearPending();
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      announcedRef.current = true;
      announceRef.current(messageRef.current, { priority });
    }, idleMs);
  }, [active, idleMs, once, priority, settleKey]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );
};
