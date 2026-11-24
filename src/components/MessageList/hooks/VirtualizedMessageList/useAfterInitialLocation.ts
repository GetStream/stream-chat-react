import { useCallback, useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/** Virtuoso reports at-top / at-bottom changes at most once per 50ms. */
const STATE_REPORT_SETTLE_MS = 60;
/** Gives up waiting for the reveal after about two seconds and runs the callback anyway. */
const MAX_WAIT_FRAMES = 120;

/**
 * react-virtuoso 4 keeps the item list hidden, at scroll offset 0, until it reaches
 * `initialTopMostItemIndex`. Meanwhile it reports the list as "at the top" (and, for a short
 * window, "at the bottom"), which would load a page of older (or newer) messages while the list
 * is being positioned and leave it somewhere else.
 *
 * `listHiddenRef` holds whether the list is hidden for that, as the list itself reports it (see
 * `makePositioningReportingList`), whatever markup a custom list renders.
 *
 * Returns a function that runs `callback` at once while the list is shown, or once it is revealed
 * and Virtuoso has had time to report where the list really is. A later call replaces a pending
 * one. A pending callback belongs to the list it was scheduled for: a change of `listKey` (the list
 * remounted, e.g. for a jump) or unmounting cancels it, and one whose list is hidden again when it
 * is due waits for that list instead.
 */
export const useAfterInitialLocation = (
  listHiddenRef: RefObject<boolean>,
  listKey: unknown,
) => {
  const frameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    frameRef.current = null;
    timeoutRef.current = null;
  }, []);

  // Runs on unmount and whenever the list is replaced.
  useEffect(() => cancel, [cancel, listKey]);

  return useCallback(
    (callback: () => void) => {
      cancel();
      if (!listHiddenRef.current) {
        callback();
        return;
      }
      let frames = 0;
      const poll = () => {
        frameRef.current = null;
        if (listHiddenRef.current && frames < MAX_WAIT_FRAMES) {
          frames += 1;
          frameRef.current = requestAnimationFrame(poll);
          return;
        }
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          // Hidden again: another positioning started meanwhile, which must not be paged under.
          if (listHiddenRef.current && frames < MAX_WAIT_FRAMES) {
            frameRef.current = requestAnimationFrame(poll);
            return;
          }
          callback();
        }, STATE_REPORT_SETTLE_MS);
      };
      frameRef.current = requestAnimationFrame(poll);
    },
    [cancel, listHiddenRef],
  );
};
