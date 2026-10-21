import { useCallback, useEffect, useRef, useState } from 'react';

// Virtuoso's at-bottom and at-top thresholds are absolute pixels, so the threshold is a fraction of
// the viewport height, clamped between Virtuoso's own default (4px) and the value for a
// full-height list (100px).
const THRESHOLD_RATIO = 0.1;
const MIN_THRESHOLD = 4;
const MAX_THRESHOLD = 100;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export type ScrollerViewport = {
  /** Threshold proportional to the viewport, for Virtuoso's at-bottom / at-top detection. */
  threshold: number;
  /** Callback for Virtuoso's `scrollerRef` prop. */
  handleScrollerRef: (element: HTMLElement | Window | null) => void;
  /**
   * Schedules a measurement on the next animation frame. Content can grow (e.g. an image landing
   * late) without a resize or scroll event, which moves the list away from its true bottom.
   */
  remeasure: () => void;
  /**
   * Whether the list is within `threshold` of its bottom. It shares Virtuoso's threshold so that
   * gating mark-read on it never disagrees with the jump-to-latest control. Unlike Virtuoso's own
   * flag, which updates only when the at-bottom state flips, it is re-measured on every content or
   * viewport change.
   */
  isAtTrueBottom: boolean;
};

/**
 * Tracks the scroll container's height and whether it sits at its true bottom, deriving a
 * threshold proportional to the viewport.
 */
export const useScrollerViewport = (): ScrollerViewport => {
  // State, not a ref: the scroller arrives after mount and the effect below must re-run then.
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | Window | null>(null);
  // Until measured, assumes a full-height list.
  const [viewportHeight, setViewportHeight] = useState(MAX_THRESHOLD / THRESHOLD_RATIO);
  const [isAtTrueBottom, setIsAtTrueBottom] = useState(true);
  const frameRef = useRef<number | null>(null);
  // Assigned by the effect below; held in a ref so `remeasure` can stay stable for callers.
  const measureRef = useRef<() => void>(() => undefined);

  const remeasure = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      measureRef.current();
    });
  }, []);

  const handleScrollerRef = useCallback((element: HTMLElement | Window | null) => {
    setScrollTarget(element);
  }, []);

  useEffect(() => {
    if (!scrollTarget) return;

    // With `useWindowScroll` Virtuoso hands back the window: scroll events arrive on it, but the
    // sizes come from the document's scrolling element.
    const isWindow = !(scrollTarget instanceof HTMLElement);
    const measured = isWindow
      ? ((document.scrollingElement ?? document.documentElement) as HTMLElement | null)
      : scrollTarget;
    if (!measured) return;

    const measure = () => {
      const height = measured.clientHeight;
      setViewportHeight(height);
      // Uses the height just measured, not state, so it agrees with the reported threshold.
      const threshold = clamp(height * THRESHOLD_RATIO, MIN_THRESHOLD, MAX_THRESHOLD);
      setIsAtTrueBottom(
        measured.scrollHeight - measured.scrollTop - measured.clientHeight <= threshold,
      );
    };

    measureRef.current = measure;
    const scheduleMeasure = remeasure;

    scrollTarget.addEventListener('scroll', scheduleMeasure, { passive: true });

    // The panel can resize without a scroll; without ResizeObserver (jsdom) only scrolls measure.
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(measured);
    }
    measure();

    return () => {
      scrollTarget.removeEventListener('scroll', scheduleMeasure);
      resizeObserver?.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      measureRef.current = () => undefined;
    };
  }, [remeasure, scrollTarget]);

  return {
    handleScrollerRef,
    isAtTrueBottom,
    remeasure,
    threshold: clamp(viewportHeight * THRESHOLD_RATIO, MIN_THRESHOLD, MAX_THRESHOLD),
  };
};
