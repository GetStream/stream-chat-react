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

  // `hasMoreNewer` turning false means the loaded window just reached the live head — typically
  // because the user scrolled down out of a window they had jumped to (a search result deep in
  // history) and the page bridging the gap arrived.
  //
  // The viewport must not move for that. The user is reading where they jumped to, and the merged
  // page lands *below* them; treating the merge like a mount (or like a newly received message at
  // the head) teleports them to the newest message. Both autoscroll paths below are suppressed for
  // this one render, and the ref is advanced afterwards so only the transition itself counts.
  const previousHasMoreNewer = useRef(hasMoreNewer);
  const justReachedLatestMessageSet = previousHasMoreNewer.current && !hasMoreNewer;

  // `behavior` is optional so callers opt into animation: the initial-mount and streaming
  // "keep pinned to bottom" autoscroll below call it with no argument and stay instant (which is
  // what keeps pagination position-preservation correct), while an interactive scroll-to-latest
  // passes `{ behavior }` for a smooth (or reduced-motion `auto`) scroll.
  const scrollToBottom = useCallback(
    (options?: { behavior?: ScrollBehavior }) => {
      if (!listElement?.scrollTo || hasMoreNewer || suppressAutoscroll) {
        return;
      }

      listElement.scrollTo({
        behavior: options?.behavior,
        top: listElement.scrollHeight,
      });
      setHasNewMessages(false);
    },
    [listElement, hasMoreNewer, suppressAutoscroll],
  );

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
      // `hasMoreNewer` is a dependency so a list that mounts before its first page resolves still
      // autoscrolls once it does. That makes this run on *every* change of it, including the merge
      // into the live head, which must leave the viewport alone.
      if (!justReachedLatestMessageSet) scrollToBottom();
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
    justReachedLatestMessageSet,
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

  // Declared after the two autoscroll layout effects and the scroll manager's own, so all three
  // observe the transition before it is consumed.
  useLayoutEffect(() => {
    previousHasMoreNewer.current = hasMoreNewer;
  }, [hasMoreNewer]);

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
