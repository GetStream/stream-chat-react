import { useEffect, useRef } from 'react';

import type { AriaLiveAnnounce, AriaLivePriority } from '../useAriaLiveAnnouncer';

export type UseSettledAnnouncementParams = {
  /**
   * While `true`, the announcement is (re)scheduled; when it flips back to `false` the armed/spoken
   * state resets, so the message can fire again the next time `active` becomes `true`.
   */
  active: boolean;
  /** The message to announce. The latest value is used when the announcement fires. */
  message: string;
  /**
   * A value whose identity changes whenever the surrounding UI is still "in motion" — e.g. the
   * array/string being edited, or a counter you bump on each relevant change. Every change restarts
   * the idle timer, so the announcement only fires once activity has stopped. Pass a value that is
   * stable between changes (an immutably-updated array/string works; avoid a fresh object literal
   * each render, which would reset the timer forever).
   */
  settleKey: unknown;
  /** Idle window (ms) the `settleKey` must be unchanged before announcing. Default `1500`. */
  idleMs?: number;
  /** Announce at most once per `active` epoch. When `false`, re-announces each time it settles again
   * while still active. Default `true`. */
  once?: boolean;
  /** Live-region priority. Default `'polite'`. */
  priority?: AriaLivePriority;
};

/**
 * Announce a message via a live region, but only after the surrounding UI has gone idle.
 *
 * Use this when an immediate announcement would be **swallowed by the screen reader's own speech** —
 * its typing echo, or the field/group re-read it performs when nearby DOM mutates. Such a read-out
 * supersedes a competing live-region update *at any priority*, so the fix is not to fight it but to
 * wait it out: each change to `settleKey` restarts an idle timer, and the message is announced only
 * once the user has paused and the screen reader has fallen quiet — landing in a calm moment instead
 * of being cut off.
 *
 * Typical shape: `active` is the condition that makes the announcement relevant (e.g. some controls
 * just became available), and `settleKey` is the thing still changing (e.g. the list/text being
 * edited). The announcement fires once per `active` epoch and re-arms when `active` goes false.
 *
 * Composable L2 policy over `announce` (from `useAriaLiveAnnouncer`), like
 * {@link useDebouncedAnnounce}. React 17/18/19 compatible — `useEffect`/`useRef` only; the pending
 * timer is cleared on unmount.
 *
 * ## When to use this vs. {@link useDebouncedAnnounce}
 *
 * Both wait out screen-reader noise (the typing echo / field re-read) before speaking, but they
 * model different problems:
 *
 * - **`useSettledAnnouncement` — a declarative ONE-SHOT cue for a STATE CHANGE.** You pass
 *   `{ active, message, settleKey }` and it reacts: it announces *once* when `active`, deferred
 *   until `settleKey` stops changing, then stays silent until `active` flips false and true again.
 *   The message is fixed; the point is "say this single fact once the UI settles". Canonical case:
 *   "the reorder/remove controls just became available" once the option list stops mutating.
 *
 * - **{@link useDebouncedAnnounce} — an imperative throttle for a value you announce REPEATEDLY.**
 *   You call `announce(key, message, ...)` yourself whenever you have a fresh value; rapid calls on
 *   a key collapse to the last. The message typically *changes* and it fires *again and again* (once
 *   per pause). Canonical case: the autocomplete result count re-announced as the user keeps typing.
 *   It has no notion of `active`/`once`/re-arming.
 *
 * | | `useDebouncedAnnounce` | `useSettledAnnouncement` |
 * | --- | --- | --- |
 * | Style | Imperative — you call `announce(key, …)` | Declarative — reacts to `{ active, message, settleKey }` |
 * | Repetition | Fires repeatedly, once per pause | Once per `active` epoch (re-arms on reset) |
 * | Message | Typically changes each time | Fixed fact |
 * | Timer reset | Each explicit call | Each `settleKey` change |
 * | Streams | Many, independent per `key` | One logical cue |
 * | Canonical case | Autocomplete count while typing | "Controls just became available" |
 *
 * Rule of thumb: announcing a **fixed fact once, after things settle** → this hook. Announcing the
 * **latest value of a changing thing** (repeatedly) → `useDebouncedAnnounce`.
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

  // Keep the latest announce/message without making them reset the idle timer (only `settleKey`
  // should do that).
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

    // Restart the idle timer on every `settleKey` change so the message lands only after activity
    // stops (after the screen reader's typing echo / field re-read, not during it).
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
