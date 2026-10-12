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
   * Schedules a fresh measurement. Content can grow without the scroller resizing or scrolling --
   * a message bubble whose avatar or image lands late -- which changes how far the list is from
   * its true bottom without firing either event we observe.
   */
  remeasure: () => void;
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
  // State rather than a ref: the scroller arrives from Virtuoso's scrollerRef callback after
  // mount, and the observers below have to attach at that point.
  const [scrollTarget, setScrollTarget] = useState<HTMLElement | Window | null>(null);
  // Until the scroller is measured, keep the behaviour a full-height list already had.
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

    // With `useWindowScroll` Virtuoso hands back the window rather than an element. The scroll
    // events still arrive on the window, but the measurements have to come from the document's
    // scrolling element -- without this the list is never measured, the thresholds stay at their
    // full-height defaults, and the true-bottom check silently answers "yes" forever.
    const isWindow = !(scrollTarget instanceof HTMLElement);
    const measured = isWindow
      ? ((document.scrollingElement ?? document.documentElement) as HTMLElement | null)
      : scrollTarget;
    if (!measured) return;

    const measure = () => {
      setViewportHeight(measured.clientHeight);
      setIsAtTrueBottom(
        measured.scrollHeight - measured.scrollTop - measured.clientHeight <=
          TRUE_BOTTOM_EPSILON,
      );
    };

    measureRef.current = measure;
    const scheduleMeasure = remeasure;

    scrollTarget.addEventListener('scroll', scheduleMeasure, { passive: true });

    // Matches useScrollLocationLogic: the panel can be resized without the list scrolling, but
    // environments without ResizeObserver (jsdom) still get the scroll-driven measurements.
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
