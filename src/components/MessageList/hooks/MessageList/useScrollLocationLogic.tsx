import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';
import type { LocalMessage } from 'stream-chat';

export type UseScrollLocationLogicParams = {
  disableAutoScrollToBottom?: boolean;
  disableScrollManagement?: boolean;
  hasMoreNewer: boolean;
  listElement: HTMLDivElement | null;
  loadMoreScrollThreshold: number;
  suppressAutoscroll: boolean;
  messages?: LocalMessage[];
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = (params: UseScrollLocationLogicParams) => {
  const {
    disableAutoScrollToBottom = false,
    disableScrollManagement = false,
    hasMoreNewer,
    listElement,
    loadMoreScrollThreshold,
    messages = [],
    scrolledUpThreshold = 200,
    suppressAutoscroll,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();
  const previousHasMoreNewerRef = useRef(hasMoreNewer);
  const justReachedLatestMessageSet = previousHasMoreNewerRef.current && !hasMoreNewer;
  const skipNextAutoScrollRef = useRef(false);

  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const previousScrollTopRef = useRef(0);

  const scrollToBottom = useCallback(
    (options?: ScrollToOptions) => {
      if (
        !listElement?.scrollTo ||
        hasMoreNewer ||
        justReachedLatestMessageSet ||
        suppressAutoscroll
      ) {
        return;
      }

      listElement.scrollTo({
        behavior: options?.behavior,
        top: listElement.scrollHeight,
      });
      setHasNewMessages(false);
    },
    [hasMoreNewer, justReachedLatestMessageSet, listElement, suppressAutoscroll],
  );

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
    }

    if (listElement && justReachedLatestMessageSet) {
      listElement.scrollTop = previousScrollTopRef.current;
      skipNextAutoScrollRef.current = true;
      return;
    }

    if (skipNextAutoScrollRef.current) {
      skipNextAutoScrollRef.current = false;
      return;
    }

    if (listElement && !disableAutoScrollToBottom) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAutoScrollToBottom, justReachedLatestMessageSet, listElement, hasMoreNewer]);

  const updateScrollTop = useMessageListScrollManager({
    disableScrollManagement,
    justReachedLatestMessageSet,
    loadMoreScrollThreshold,
    messages,
    onScrollBy: (scrollBy) => {
      listElement?.scrollBy({ top: scrollBy });
    },

    scrollContainerMeasures: () => ({
      offsetHeight: listElement?.offsetHeight || 0,
      scrollHeight: listElement?.scrollHeight || 0,
    }),
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages: () => setHasNewMessages(true),
  });

  useLayoutEffect(() => {
    previousHasMoreNewerRef.current = hasMoreNewer;
  }, [hasMoreNewer]);

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.target as HTMLDivElement;
      const scrollTop = element.scrollTop;
      previousScrollTopRef.current = scrollTop;

      updateScrollTop(scrollTop);

      const offsetHeight = element.offsetHeight;
      const scrollHeight = element.scrollHeight;

      const prevCloseToBottom = closeToBottom.current;
      closeToBottom.current =
        scrollHeight - (scrollTop + offsetHeight) < scrolledUpThreshold;
      closeToTop.current = scrollTop < scrolledUpThreshold;

      if (closeToBottom.current) {
        setHasNewMessages(false);
      }
      if (prevCloseToBottom && !closeToBottom.current) {
        setIsMessageListScrolledToBottom(false);
      } else if (!prevCloseToBottom && closeToBottom.current) {
        setIsMessageListScrolledToBottom(true);
      }
    },
    [updateScrollTop, closeToTop, closeToBottom, scrolledUpThreshold],
  );

  return {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};
