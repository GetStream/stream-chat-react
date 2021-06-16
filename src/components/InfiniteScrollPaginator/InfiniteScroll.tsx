import React, { useCallback, useEffect, useRef } from 'react';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

const calculateTopPosition = (element: HTMLElement | Element | null): number => {
  if (element instanceof HTMLElement) {
    return element.offsetTop + calculateTopPosition(element.offsetParent);
  }
  return 0;
};

/**
 * Computes by recursively summing offsetTop until an element without offsetParent is reached
 */
const calculateOffset = (element: HTMLElement, scrollTop: number) => {
  if (!element) {
    return 0;
  }

  return calculateTopPosition(element) + (element.offsetHeight - scrollTop - window.innerHeight);
};

export type InfiniteScrollProps = {
  className?: string;
  element?: React.ElementType;
  hasMore?: boolean;
  initialLoad?: boolean;
  isLoading?: boolean;
  isReverse?: boolean;
  listenToScroll?: (offset: number, reverseOffset: number, threshold: number) => void;
  loader?: React.ReactNode;
  loading?: React.ReactNode;
  loadMore?: () => void;
  pageStart?: number;
  threshold?: number;
  useCapture?: boolean;
  useWindow?: boolean;
};

export const InfiniteScroll: React.FC<InfiniteScrollProps> = (props) => {
  const {
    children,
    element = 'div',
    hasMore = false,
    initialLoad = true,
    isLoading = false,
    isReverse = false,
    listenToScroll,
    loader,
    loadMore,
    threshold = 250,
    useCapture = false,
    useWindow = true,
    ...elementProps
  } = props;

  const scrollComponent = useRef<HTMLElement>();

  const scrollListener = useCallback(() => {
    const element = scrollComponent.current;
    if (!element) return;
    const { parentElement } = element;

    let offset = 0;
    let reverseOffset = 0;
    if (useWindow) {
      const doc = document.documentElement || document.body.parentNode || document.body;
      const scrollTop = window.pageYOffset !== undefined ? window.pageYOffset : doc.scrollTop;
      offset = calculateOffset(element, scrollTop);
      reverseOffset = scrollTop;
    } else if (parentElement) {
      offset = element.scrollHeight - parentElement.scrollTop - parentElement.clientHeight;
      reverseOffset = parentElement.scrollTop;
    }
    if (listenToScroll) {
      listenToScroll(offset, reverseOffset, threshold);
    }

    // Here we make sure the element is visible as well as checking the offset
    if (
      (isReverse ? reverseOffset : offset) < Number(threshold) &&
      element.offsetParent !== null &&
      typeof loadMore === 'function' &&
      hasMore
    ) {
      loadMore();
    }
  }, [hasMore, useWindow, isReverse, threshold, listenToScroll, loadMore]);

  useEffect(() => {
    const scrollElement = useWindow ? window : scrollComponent.current?.parentNode;
    if (isLoading || !scrollElement) {
      return () => undefined;
    }

    scrollElement.addEventListener('scroll', scrollListener, useCapture);
    scrollElement.addEventListener('resize', scrollListener, useCapture);

    if (initialLoad) {
      scrollListener();
    }

    return () => {
      scrollElement.removeEventListener('scroll', scrollListener, useCapture);
      scrollElement.removeEventListener('resize', scrollListener, useCapture);
    };
  }, [initialLoad, isLoading, scrollListener, useCapture, useWindow]);

  useEffect(() => {
    const scrollElement = useWindow ? window : scrollComponent.current?.parentNode;
    if (scrollElement) {
      scrollElement.addEventListener('wheel', mousewheelListener, { passive: false });
    }
    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('wheel', mousewheelListener, useCapture);
      }
    };
  }, [useCapture, useWindow]);

  const attributes = {
    ...elementProps,
    ref: (element: HTMLElement) => {
      scrollComponent.current = element;
    },
  };

  const childrenArray = [children];
  if (isLoading && loader) {
    if (isReverse) {
      childrenArray.unshift(loader);
    } else {
      childrenArray.push(loader);
    }
  }
  return React.createElement(element, attributes, childrenArray);
};
