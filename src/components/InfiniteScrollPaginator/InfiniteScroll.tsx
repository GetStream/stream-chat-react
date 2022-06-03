import React, { PropsWithChildren, useCallback, useEffect, useRef } from 'react';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

export type InfiniteScrollProps = {
  className?: string;
  element?: React.ElementType;
  hasMore?: boolean;
  hasMoreNewer?: boolean;
  initialLoad?: boolean;
  isLoading?: boolean;
  listenToScroll?: (offset: number, reverseOffset: number, threshold: number) => void;
  loader?: React.ReactNode;
  loading?: React.ReactNode;
  loadMore?: () => void;
  loadMoreNewer?: () => void;
  pageStart?: number;
  threshold?: number;
  useCapture?: boolean;
};

export const InfiniteScroll = (props: PropsWithChildren<InfiniteScrollProps>) => {
  const {
    children,
    element = 'div',
    hasMore = false,
    hasMoreNewer = false,
    initialLoad = true,
    isLoading = false,
    listenToScroll,
    loader,
    loadMore,
    loadMoreNewer,
    threshold = 250,
    useCapture = false,
    ...elementProps
  } = props;

  const scrollComponent = useRef<HTMLElement>();

  const scrollListener = useCallback(() => {
    const element = scrollComponent.current;

    if (!element || element.offsetParent === null) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parentElement = element.parentElement!;

    const offset = element.scrollHeight - parentElement.scrollTop - parentElement.clientHeight;
    const reverseOffset = parentElement.scrollTop;

    if (listenToScroll) {
      listenToScroll(offset, reverseOffset, threshold);
    }

    if (reverseOffset < Number(threshold) && typeof loadMore === 'function' && hasMore) {
      loadMore();
    }

    if (offset < Number(threshold) && typeof loadMoreNewer === 'function' && hasMoreNewer) {
      loadMoreNewer();
    }
  }, [hasMore, hasMoreNewer, threshold, listenToScroll, loadMore, loadMoreNewer]);

  useEffect(() => {
    const scrollElement = scrollComponent.current?.parentNode;
    if (isLoading || !scrollElement) {
      return () => undefined;
    }

    scrollElement.addEventListener('scroll', scrollListener, useCapture);
    scrollElement.addEventListener('resize', scrollListener, useCapture);

    return () => {
      scrollElement.removeEventListener('scroll', scrollListener, useCapture);
      scrollElement.removeEventListener('resize', scrollListener, useCapture);
    };
  }, [initialLoad, isLoading, scrollListener, useCapture]);

  useEffect(() => {
    const scrollElement = scrollComponent.current?.parentNode;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', mousewheelListener, { passive: false });
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('wheel', mousewheelListener, useCapture);
      }
    };
  }, [useCapture]);

  const attributes = {
    ...elementProps,
    ref: (element: HTMLElement) => {
      scrollComponent.current = element;
    },
  };

  const childrenArray = [children];
  if (isLoading && loader) {
    childrenArray.unshift(loader);
  }
  return React.createElement(element, attributes, childrenArray);
};
