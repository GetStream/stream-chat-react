import { useEffect, useState } from 'react';
import throttle from 'lodash.throttle';

import {
  FLOATING_DATE_MEASURE_THROTTLE_MS,
  isFloatingSlotTaken,
} from './floatingDateSlot';

/**
 * Tracks `isFloatingSlotTaken` for a scroll container, re-checked on scroll and resize. A window
 * scroller has no top edge the floating separator is pinned to, so it never reports the spot taken.
 */
export const useIsFloatingDateSlotTaken = (
  scrollElement: HTMLElement | Window | null,
) => {
  // Holds the element the result was measured on, so a replaced `scrollElement` never reads as taken.
  const [measured, setMeasured] = useState<{
    element: HTMLElement;
    isTaken: boolean;
  } | null>(null);

  useEffect(() => {
    if (!scrollElement || !('querySelectorAll' in scrollElement)) return;

    const update = throttle(
      () =>
        setMeasured({
          element: scrollElement,
          isTaken: isFloatingSlotTaken(scrollElement),
        }),
      FLOATING_DATE_MEASURE_THROTTLE_MS,
    );

    update();
    scrollElement.addEventListener('scroll', update, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
    resizeObserver?.observe(scrollElement);

    return () => {
      scrollElement.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
      update.cancel();
    };
  }, [scrollElement]);

  return measured !== null && measured.element === scrollElement && measured.isTaken;
};
