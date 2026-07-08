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
    // MERGE-RECONCILE: master's useMessageListScrollManager expects anchor-based restoration
    // params (captureAnchor/restoreAnchor/onScrollToTop) that PR #2909's useScrollLocationLogic
    // does not compute. captureAnchor returns null so the manager falls back to its
    // height-delta compensation (no precise anchor restoration). Reconcile the two scroll
    // paths if precise anchor preservation on older-page loads is required.
    captureAnchor: () => null,
    loadMoreScrollThreshold,
    messages,
    onScrollBy: (scrollBy) => {
      listElement?.scrollBy({ top: scrollBy });
    },
    onScrollToTop: () => {
      listElement?.scrollTo({ top: 0 });
    },
    restoreAnchor: () => undefined,

    scrollContainerMeasures: () => ({
      offsetHeight: listElement?.offsetHeight || 0,
      scrollHeight: listElement?.scrollHeight || 0,
      // MERGE-RECONCILE: master's ContainerMeasures requires scrollTop (used by the
      // anchor-based useMessageListScrollManager); PR #2909's version omitted it.
      scrollTop: listElement?.scrollTop || 0,
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
