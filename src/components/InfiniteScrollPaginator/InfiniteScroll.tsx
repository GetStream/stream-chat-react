import React, { PropsWithChildren, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { PaginatorProps } from '../../types/types';
import { deprecationAndReplacementWarning } from '../../utils/deprecationWarning';

/**
 * Prevents Chrome hangups
 * See: https://stackoverflow.com/questions/47524205/random-high-content-download-time-in-chrome/47684257#47684257
 */
const mousewheelListener = (event: Event) => {
  if (event instanceof WheelEvent && event.deltaY === 1) {
    event.preventDefault();
  }
};

export type InfiniteScrollProps = PaginatorProps & {
  className?: string;
  element?: React.ElementType;
  /**
   * @desc Flag signalling whether more pages with older items can be loaded
   * @deprecated Use hasPreviousPage prop instead. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  hasMore?: boolean;
  /**
   * @desc Flag signalling whether more pages with newer items can be loaded
   * @deprecated Use hasNextPage prop instead. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  hasMoreNewer?: boolean;
  /** Element to be rendered at the top of the thread message list. By default, Message and ThreadStart components */
  head?: React.ReactNode;
  initialLoad?: boolean;
  isLoading?: boolean;
  listenToScroll?: (offset: number, reverseOffset: number, threshold: number) => void;
  loader?: React.ReactNode;
  /**
   * @desc Function that loads previous page with older items
   * @deprecated Use loadPreviousPage prop instead. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  loadMore?: () => void;
  /**
   * @desc Function that loads next page with newer items
   * @deprecated Use loadNextPage prop instead. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  loadMoreNewer?: () => void;
  useCapture?: boolean;
};

export const InfiniteScroll = (props: PropsWithChildren<InfiniteScrollProps>) => {
  const {
    children,
    element = 'div',
    hasMore,
    hasMoreNewer,
    hasNextPage,
    hasPreviousPage,
    head,
    initialLoad = true,
    isLoading,
    listenToScroll,
    loader,
    loadMore,
    loadMoreNewer,
    loadNextPage,
    loadPreviousPage,
    threshold = 250,
    useCapture = false,
    ...elementProps
  } = props;

  const loadNextPageFn = loadNextPage || loadMoreNewer;
  const loadPreviousPageFn = loadPreviousPage || loadMore;
  const hasNextPageFlag = hasNextPage || hasMoreNewer;
  const hasPreviousPageFlag = hasPreviousPage || hasMore;

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

    if (isLoading) return;

    if (
      reverseOffset < Number(threshold) &&
      typeof loadPreviousPageFn === 'function' &&
      hasPreviousPageFlag
    ) {
      loadPreviousPageFn();
    }

    if (offset < Number(threshold) && typeof loadNextPageFn === 'function' && hasNextPageFlag) {
      loadNextPageFn();
    }
  }, [
    hasPreviousPageFlag,
    hasNextPageFlag,
    isLoading,
    listenToScroll,
    loadPreviousPageFn,
    loadNextPageFn,
    threshold,
  ]);

  useEffect(() => {
    deprecationAndReplacementWarning(
      [
        [{ hasMoreNewer }, { hasNextPage }],
        [{ loadMoreNewer }, { loadNextPage }],
        [{ hasMore }, { hasPreviousPage }],
        [{ loadMore }, { loadPreviousPage }],
      ],
      'InfiniteScroll',
    );
  }, []);

  useLayoutEffect(() => {
    const scrollElement = scrollComponent.current?.parentNode;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', scrollListener, useCapture);
    scrollElement.addEventListener('resize', scrollListener, useCapture);

    return () => {
      scrollElement.removeEventListener('scroll', scrollListener, useCapture);
      scrollElement.removeEventListener('resize', scrollListener, useCapture);
    };
  }, [initialLoad, scrollListener, useCapture]);

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

  const childrenArray = [loader, children];

  if (head) {
    childrenArray.unshift(head);
  }

  return React.createElement(element, attributes, childrenArray);
};
