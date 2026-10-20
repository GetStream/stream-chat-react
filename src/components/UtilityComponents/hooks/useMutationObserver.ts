import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { useStableCallback } from '../../../utils/useStableCallback';

const DEFAULT_INIT: MutationObserverInit = { childList: true, subtree: true };
const NOOP = () => undefined;

export type UseMutationObserverOptions = {
  /** Whether to observe; `false` disconnects and runs `onDisconnect`. Defaults to `true`. */
  enabled?: boolean;
  /** `MutationObserver` init, read on connect. Defaults to `{ childList: true, subtree: true }`. */
  init?: MutationObserverInit;
  /**
   * Runs whenever observation stops, including on unmount, to clean up side effects of
   * `onMutation`.
   */
  onDisconnect?: () => void;
  /** Also calls `onMutation` once right after connecting. Defaults to `true`. */
  runOnConnect?: boolean;
};

/**
 * Runs `onMutation` when the observed subtree of `ref` changes, and once on connect unless
 * `runOnConnect` is `false`. The latest `onMutation` and `onDisconnect` are used without
 * reconnecting the observer.
 *
 * It reconnects on an `enabled` change or a remount, not when `ref.current` is swapped silently;
 * use a `key` or toggle `enabled` when the target changes.
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

    // Without `MutationObserver` (e.g. a non-DOM test environment) only the initial call and the
    // disconnect cleanup run.
    if (typeof MutationObserver === 'undefined') return handleDisconnect;

    const observer = new MutationObserver(() => handleMutation());
    observer.observe(target, initRef.current);

    return () => {
      observer.disconnect();
      handleDisconnect();
    };
  }, [enabled, handleDisconnect, handleMutation, ref, runOnConnect]);
};
