import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Virtuoso's at-bottom and at-top thresholds are absolute pixels, so a value tuned for a
 * full-height list means something very different in a short floating panel. These bounds keep the
 * derived threshold proportional to the viewport while staying within what Virtuoso behaves well
 * with: its own default is 4px, and 100px is what a full-height list effectively used.
 */
const THRESHOLD_RATIO = 0.1;
const MIN_THRESHOLD = 4;
const MAX_THRESHOLD = 100;

/** Distance from the true bottom, in pixels, still counted as "the last message is fully shown". */
const TRUE_BOTTOM_EPSILON = 4;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export type ScrollerViewport = {
  /** Threshold proportional to the viewport, for Virtuoso's at-bottom / at-top detection. */
  threshold: number;
  /** Callback for Virtuoso's `scrollerRef` prop. */
  handleScrollerRef: (element: HTMLElement | Window | null) => void;
  /**
   * Whether the list is at its true bottom, within a few pixels. Unlike Virtuoso's thresholded
   * at-bottom flag this does not go true while part of the last message is still below the fold,
   * which is what makes it safe to gate marking a channel read.
   */
  isAtTrueBottom: boolean;
};

/**
 * Tracks the scroll container's height and whether it sits at its true bottom, so thresholds can
 * scale with the rendered list rather than assuming a full-height one.
 */
export const useScrollerViewport = (): ScrollerViewport => {
  // State rather than a ref: the element arrives from Virtuoso's scrollerRef callback after
  // mount, and the observers below have to attach at that point.
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  // Until the scroller is measured, keep the behaviour a full-height list already had.
  const [viewportHeight, setViewportHeight] = useState(MAX_THRESHOLD / THRESHOLD_RATIO);
  const [isAtTrueBottom, setIsAtTrueBottom] = useState(true);
  const frameRef = useRef<number | null>(null);

  const handleScrollerRef = useCallback((element: HTMLElement | Window | null) => {
    // Virtuoso types this as HTMLElement | Window; the message list always scrolls an element.
    setScroller(element instanceof HTMLElement ? element : null);
  }, []);

  useEffect(() => {
    if (!scroller) return;

    const measure = () => {
      frameRef.current = null;
      setViewportHeight(scroller.clientHeight);
      setIsAtTrueBottom(
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <=
          TRUE_BOTTOM_EPSILON,
      );
    };

    const scheduleMeasure = () => {
      if (frameRef.current !== null) return;
      frameRef.current = requestAnimationFrame(measure);
    };

    scroller.addEventListener('scroll', scheduleMeasure, { passive: true });

    // Matches useScrollLocationLogic: the panel can be resized without the list scrolling, but
    // environments without ResizeObserver (jsdom) still get the scroll-driven measurements.
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure);
      resizeObserver.observe(scroller);
    }
    measure();

    return () => {
      scroller.removeEventListener('scroll', scheduleMeasure);
      resizeObserver?.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [scroller]);

  return {
    handleScrollerRef,
    isAtTrueBottom,
    threshold: clamp(viewportHeight * THRESHOLD_RATIO, MIN_THRESHOLD, MAX_THRESHOLD),
  };
};
