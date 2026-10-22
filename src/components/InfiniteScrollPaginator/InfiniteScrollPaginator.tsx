import clsx from 'clsx';
import throttle from 'lodash.throttle';
import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD } from '../../constants/limits';

// Prevents Chrome hangups, see:
// https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

type DistancesToEdges = { distanceFromBottom: number; distanceFromTop: number };

/** The scroll position's distance to both ends of the content; `null` while hidden or unmounted. */
const getDistancesToEdges = (
  root: HTMLElement | null,
  content: HTMLElement | null,
): DistancesToEdges | null => {
  if (!root || root.offsetParent === null || !content) return null;
  return {
    distanceFromBottom: content.scrollHeight - root.scrollTop - root.clientHeight,
    distanceFromTop: root.scrollTop,
  };
};

type EdgesWithinThreshold = { nearBottom: boolean; nearTop: boolean };

const NO_EDGE_WITHIN_THRESHOLD: EdgesWithinThreshold = {
  nearBottom: false,
  nearTop: false,
};

/** The edges whose next page the scroll position is close enough to load. */
const getEdgesWithinThreshold = (
  { distanceFromBottom, distanceFromTop }: DistancesToEdges,
  threshold: number,
): EdgesWithinThreshold => ({
  nearBottom: distanceFromBottom < threshold,
  nearTop: distanceFromTop < threshold,
});

/** Whether `current` is within the threshold of an edge that `previous` was not. */
const reachedAnotherEdge = (
  previous: EdgesWithinThreshold,
  current: EdgesWithinThreshold,
) =>
  (current.nearTop && !previous.nearTop) || (current.nearBottom && !previous.nearBottom);

type InfiniteScrollPaginatorOwnProps = {
  element?: React.ElementType;
  /**
   * Props for the inner element that wraps `children`, e.g. `role="presentation"` to keep it out of
   * the accessibility tree so a `listbox` or `menu` ancestor still owns its `option` or `menuitem`
   * children.
   */
  contentProps?: React.ComponentProps<'div'>;
  /**
   * Called with the scroll distances on each check of the distance to the edges (see
   * `loadNextDebounceMs`).
   */
  listenToScroll?: (
    distanceFromBottom: number,
    distanceFromTop: number,
    threshold: number,
  ) => void;
  /**
   * The minimum interval, in milliseconds, between two checks of the distance to the edges while
   * the list scrolls or resizes. Scrolling is checked as it happens, not once it stops: the first
   * scroll, and the first one within `threshold` of an edge, are checked at once, and a final check
   * runs when the interval ends, so the position the scrolling stopped at is always checked.
   * Defaults to 500.
   */
  loadNextDebounceMs?: number;
  loadNextOnScrollToBottom?: () => void;
  loadNextOnScrollToTop?: () => void;
  /** Distance (px) from the top or bottom within which the `loadNextOnScroll*` callbacks fire. */
  threshold?: number;
  useCapture?: boolean;
};

// Polymorphic props, defaulting to 'div'. `ref` comes from `ComponentPropsWithRef<C>`, so no
// separate `ref?` member is declared (the react-compat lint rule forbids one in a prop type).
export type InfiniteScrollPaginatorProps<C extends React.ElementType = 'div'> =
  PropsWithChildren<
    InfiniteScrollPaginatorOwnProps & {
      element?: C;
    } & Omit<
        React.ComponentPropsWithRef<C>,
        keyof InfiniteScrollPaginatorOwnProps | 'element'
      >
  >;

type InfiniteScrollPaginatorComponent = <C extends React.ElementType = 'div'>(
  props: InfiniteScrollPaginatorProps<C>,
) => React.ReactNode;

const renderPolymorphic = <C extends React.ElementType>(
  Comp: C,
  props: React.ComponentPropsWithRef<C>,
  children?: React.ReactNode,
) => React.createElement(Comp, props, children);

export const InfiniteScrollPaginator = forwardRef(function InfiniteScrollPaginator<
  E extends React.ElementType = 'div',
>(props: InfiniteScrollPaginatorProps<E>, ref: React.ForwardedRef<unknown>) {
  const {
    children,
    className,
    contentProps,
    element: Component = 'div' as E,
    listenToScroll,
    loadNextDebounceMs = 500,
    loadNextOnScrollToBottom,
    loadNextOnScrollToTop,
    threshold = DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
    useCapture = false,
    ...componentProps
  } = props;
  const { className: contentClassName, ...contentRestProps } = contentProps ?? {};

  const rootRef = useRef<HTMLElement | null>(null);
  const childRef = useRef<HTMLDivElement | null>(null);

  // Reports the distances and loads the next page at an edge, at most once per interval (the first
  // call at once, the latest one when the interval ends). The loaders guard against being called
  // while a page loads.
  const checkDistanceToEdges = useMemo(
    () =>
      throttle(
        () => {
          const distances = getDistancesToEdges(rootRef.current, childRef.current);
          if (!distances) return;

          listenToScroll?.(
            distances.distanceFromBottom,
            distances.distanceFromTop,
            threshold,
          );

          const { nearBottom, nearTop } = getEdgesWithinThreshold(distances, threshold);
          if (nearTop) loadNextOnScrollToTop?.();
          if (nearBottom) loadNextOnScrollToBottom?.();
        },
        loadNextDebounceMs,
        { leading: true, trailing: true },
      ),
    [
      listenToScroll,
      loadNextDebounceMs,
      loadNextOnScrollToBottom,
      loadNextOnScrollToTop,
      threshold,
    ],
  );

  // A check left for the end of the interval belongs to the props it was created with.
  useEffect(() => () => checkDistanceToEdges.cancel(), [checkDistanceToEdges]);

  const edgesWithinThresholdRef = useRef(NO_EDGE_WITHIN_THRESHOLD);

  // Checks while scrolling rather than once it stops. Reaching an edge's threshold runs the check at
  // once: waiting for the interval to end would let a fast scroll reach the edge before the next
  // page starts loading.
  const scrollListener = useCallback(() => {
    checkDistanceToEdges();
    const distances = getDistancesToEdges(rootRef.current, childRef.current);
    const edgesWithinThreshold = distances
      ? getEdgesWithinThreshold(distances, threshold)
      : NO_EDGE_WITHIN_THRESHOLD;
    if (reachedAnotherEdge(edgesWithinThresholdRef.current, edgesWithinThreshold)) {
      checkDistanceToEdges.flush();
    }
    edgesWithinThresholdRef.current = edgesWithinThreshold;
  }, [checkDistanceToEdges, threshold]);

  useEffect(() => {
    const scrollElement = rootRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', scrollListener, useCapture);

    return () => {
      scrollElement.removeEventListener('scroll', scrollListener, useCapture);
    };
  }, [scrollListener, useCapture]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined' || !scrollListener) return;
    const observer = new ResizeObserver(scrollListener);
    observer.observe(root as Element);

    return () => {
      observer.disconnect();
    };
  }, [scrollListener]);

  useEffect(() => {
    const root = rootRef.current;
    if (root) {
      root.addEventListener('wheel', mousewheelListener, { passive: false });
    }
    return () => {
      if (root) {
        root.removeEventListener('wheel', mousewheelListener);
      }
    };
  }, []);

  return renderPolymorphic(
    Component as E,
    {
      ...(componentProps as React.ComponentPropsWithRef<E>),
      className: clsx('str-chat__infinite-scroll-paginator', className),
      ref: (node: React.ComponentRef<E> | null) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref && 'current' in ref) {
          (ref as React.RefObject<React.ComponentRef<E> | null>).current = node;
        }
        rootRef.current = node && node instanceof HTMLElement ? node : null;
      },
    },
    React.createElement(
      'div',
      {
        ...contentRestProps,
        className: clsx('str-chat__infinite-scroll-paginator__content', contentClassName),
        ref: childRef,
      },
      children,
    ),
  );
}) as InfiniteScrollPaginatorComponent;
