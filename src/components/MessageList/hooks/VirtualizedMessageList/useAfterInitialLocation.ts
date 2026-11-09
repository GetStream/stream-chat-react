import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** The element Virtuoso renders the items into (react-virtuoso ≥ 4.7.9 test ID). */
const ITEM_LIST_SELECTOR = '[data-testid="virtuoso-item-list"]';
/** Virtuoso reports at-top / at-bottom changes at most once per 50ms. */
const STATE_REPORT_SETTLE_MS = 60;
/** Gives up waiting for the reveal after about two seconds and runs the callback anyway. */
const MAX_WAIT_FRAMES = 120;

const isItemListHidden = (container: HTMLElement | null) =>
  container?.querySelector<HTMLElement>(ITEM_LIST_SELECTOR)?.style.visibility ===
  'hidden';

/**
 * react-virtuoso 4 keeps the item list hidden, at scroll offset 0, until it reaches
 * `initialTopMostItemIndex`. Meanwhile it reports the list as "at the top" (and, for a short
 * window, "at the bottom"), which would load a page of older (or newer) messages while the list
 * is being positioned and leave it somewhere else.
 *
 * Returns a function that runs `callback` at once while the list is shown, or once it is revealed
 * and Virtuoso has had time to report where the list really is. A later call replaces a pending
 * one, and unmounting cancels it.
 */
export const useAfterInitialLocation = (containerRef: RefObject<HTMLElement | null>) => {
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    frameRef.current = null;
    timeoutRef.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return useCallback(
    (callback: () => void) => {
      cancel();
      if (!isItemListHidden(containerRef.current)) {
        callback();
        return;
      }
      let frames = 0;
      const poll = () => {
        frameRef.current = null;
        if (isItemListHidden(containerRef.current) && frames < MAX_WAIT_FRAMES) {
          frames += 1;
          frameRef.current = requestAnimationFrame(poll);
          return;
        }
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          callback();
        }, STATE_REPORT_SETTLE_MS);
      };
      frameRef.current = requestAnimationFrame(poll);
    },
    [cancel, containerRef],
  );
};
