import clsx from 'clsx';
import debounce from 'lodash.debounce';
import type { PropsWithChildren } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD } from '../../constants/limits';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

export type InfiniteScrollPaginatorProps = React.ComponentProps<'div'> & {
  listenToScroll?: (
    distanceFromBottom: number,
    distanceFromTop: number,
    threshold: number,
  ) => void;
  loadNextDebounceMs?: number;
  loadNextOnScrollToBottom?: () => void;
  loadNextOnScrollToTop?: () => void;
  /** Offset from when to start the loadNextPage call */
  threshold?: number;
  useCapture?: boolean;
};

export const InfiniteScrollPaginator = (
  props: PropsWithChildren<InfiniteScrollPaginatorProps>,
) => {
  const {
    children,
    className,
    listenToScroll,
    loadNextDebounceMs = 500,
    loadNextOnScrollToBottom,
    loadNextOnScrollToTop,
    threshold = DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
    useCapture = false,
    ...componentProps
  } = props;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const childRef = useRef<HTMLDivElement | null>(null);

  const scrollListener = useMemo(
    () =>
      debounce(() => {
        const root = rootRef.current;
        const child = childRef.current;
        if (!root || root.offsetParent === null || !child) {
          return;
        }

        const distanceFromBottom =
          child.scrollHeight - root.scrollTop - root.clientHeight;
        const distanceFromTop = root.scrollTop;

        if (listenToScroll) {
          listenToScroll(distanceFromBottom, distanceFromTop, threshold);
        }

        if (distanceFromTop < Number(threshold)) {
          loadNextOnScrollToTop?.();
        }

        if (distanceFromBottom < Number(threshold)) {
          loadNextOnScrollToBottom?.();
        }
      }, loadNextDebounceMs),
    [
      listenToScroll,
      loadNextDebounceMs,
      loadNextOnScrollToBottom,
      loadNextOnScrollToTop,
      threshold,
    ],
  );

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
        root.removeEventListener('wheel', mousewheelListener, useCapture);
      }
    };
  }, [useCapture]);

  return (
    <div
      {...componentProps}
      className={clsx('str-chat__infinite-scroll-paginator', className)}
      ref={rootRef}
    >
      <div className='str-chat__infinite-scroll-paginator__content' ref={childRef}>
        {children}
      </div>
    </div>
  );
};
