import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';
import type { LocalMessage } from 'stream-chat';

export type UseScrollLocationLogicParams = {
  hasMoreNewer: boolean;
  listElement: HTMLElement | null;
  loadMoreScrollThreshold: number;
  suppressAutoscroll?: boolean;
  messages?: LocalMessage[];
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = (params: UseScrollLocationLogicParams) => {
  const {
    hasMoreNewer,
    listElement,
    loadMoreScrollThreshold,
    messages = [],
    scrolledUpThreshold = 200,
    suppressAutoscroll = false,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const initialDataAutoscrollDoneRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (!listElement?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    listElement.scrollTo({
      top: listElement.scrollHeight,
    });
    setHasNewMessages(false);
  }, [listElement, hasMoreNewer, suppressAutoscroll]);

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listElement, hasMoreNewer]);

  useLayoutEffect(() => {
    if (messages.length === 0) {
      initialDataAutoscrollDoneRef.current = false;
      return;
    }

    if (
      listElement?.scrollTo &&
      !initialDataAutoscrollDoneRef.current &&
      !suppressAutoscroll
    ) {
      listElement.scrollTo({ top: listElement.scrollHeight });
      setHasNewMessages(false);
      initialDataAutoscrollDoneRef.current = true;
    }
  }, [listElement, messages.length, suppressAutoscroll]);

  const updateScrollTop = useMessageListScrollManager({
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
    suppressAutoscroll,
  });

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      const element = event.target as HTMLElement;
      const scrollTop = element.scrollTop;

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
