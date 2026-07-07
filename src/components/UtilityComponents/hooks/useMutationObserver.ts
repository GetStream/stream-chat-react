import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { useStableCallback } from '../../../utils/useStableCallback';

const DEFAULT_INIT: MutationObserverInit = { childList: true, subtree: true };
const NOOP = () => undefined;

export type UseMutationObserverOptions = {
  /** When `false`, the observer is not connected (and `onDisconnect` runs if it was). Default `true`. */
  enabled?: boolean;
  /** `MutationObserver` init, read when (re)connecting. Default `{ childList: true, subtree: true }`. */
  init?: MutationObserverInit;
  /** Runs when observation stops — target/`enabled` change or unmount. Use to clean up side effects
   * started in `onMutation` (e.g. cancel a pending announcement). */
  onDisconnect?: () => void;
  /** Also invoke `onMutation` once right after connecting, to react to the current DOM. Default `true`. */
  runOnConnect?: boolean;
};

/**
 * Runs `onMutation` whenever the observed subtree of `ref` changes (and, by default, once on
 * connect). A thin, generic wrapper around `MutationObserver`: toggle with `enabled`, react to the
 * initial state with `runOnConnect`, and clean up side effects via `onDisconnect`. The latest
 * `onMutation`/`onDisconnect` are always used without reconnecting the observer.
 *
 * Note: like any `useEffect`-based hook, it (re)connects on `enabled` change or remount — not on a
 * silent `ref.current` swap. Drive remounts with a `key` or toggle `enabled` if the target changes.
 */
export const useMutationObserver = (
  ref: RefObject<HTMLElement | null>,
  onMutation: () => void,
  {
    enabled = true,
    init = DEFAULT_INIT,
    onDisconnect,
    runOnConnect = true,
  }: UseMutationObserverOptions = {},
) => {
  // Stable identities that always call the latest callback, so updating either does not reconnect
  // the observer.
  const handleMutation = useStableCallback(onMutation);
  const handleDisconnect = useStableCallback(onDisconnect ?? NOOP);
  // `init` is read only when (re)connecting; keep it off the effect deps so a fresh object literal
  // each render does not reconnect.
  const initRef = useRef(init);
  initRef.current = init;

  useEffect(() => {
    const target = ref.current;
    if (!enabled || !target) return;

    if (runOnConnect) handleMutation();

    // `MutationObserver` is available in every browser the SDK targets (and this runs only in an
    // effect, never during SSR), but degrade gracefully if it is missing — e.g. a non-DOM test
    // environment: react to the initial state and still run the disconnect cleanup, just without
    // observing further changes.
    if (typeof MutationObserver === 'undefined') return handleDisconnect;

    const observer = new MutationObserver(() => handleMutation());
    observer.observe(target, initRef.current);

    return () => {
      observer.disconnect();
      handleDisconnect();
    };
  }, [enabled, handleDisconnect, handleMutation, ref, runOnConnect]);
};
