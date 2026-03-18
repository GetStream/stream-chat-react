import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { measureScrollWork } from './scrollInstrumentation';
import { useMessageListScrollManager } from './useMessageListScrollManager';
import type { LocalMessage } from 'stream-chat';

export type UseScrollLocationLogicParams = {
  disableAutoScrollToBottom?: boolean;
  disableScrollManagement?: boolean;
  hasMoreNewer: boolean;
  listElement: HTMLDivElement | null;
  loadMoreScrollThreshold: number;
  loadingMore?: boolean;
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
    loadingMore = false,
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
  const isRestoringOlderAnchorRef = useRef(false);

  const [isMessageListScrolledToBottom, setIsMessageListScrolledToBottom] =
    useState(true);
  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const previousScrollTopRef = useRef(0);
  const anchorRestoreCleanupRef = useRef<(() => void) | null>(null);

  const captureAnchor = useCallback(
    () =>
      measureScrollWork('message-list-scroll:capture-anchor', () => {
        if (!listElement) return null;

        const listRect = listElement.getBoundingClientRect();
        const listTop = listRect.top;
        const listCenter = listTop + listRect.height / 2;
        // Older-page pagination should track the top edge, while the generic
        // “keep this viewport stable” case works better from the center.
        const preferTopEdgeAnchor =
          loadingMore || listElement.scrollTop < loadMoreScrollThreshold;
        const messageElements = Array.from(
          listElement.querySelectorAll<HTMLElement>('[data-message-id]'),
        );

        const visibleMessageElements = messageElements.filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.bottom > listTop && rect.top < listRect.bottom;
        });

        const topEdgeAnchorElement = visibleMessageElements.reduce<HTMLElement | null>(
          (closest, element) => {
            if (!closest) return element;

            const elementTop = element.getBoundingClientRect().top;
            const closestTop = closest.getBoundingClientRect().top;

            return elementTop < closestTop ? element : closest;
          },
          null,
        );

        const centerAnchorElement =
          visibleMessageElements.find((element) => {
            const rect = element.getBoundingClientRect();
            return rect.top <= listCenter && rect.bottom >= listCenter;
          }) ??
          visibleMessageElements.reduce<HTMLElement | null>((closest, element) => {
            const rect = element.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - listCenter);

            if (!closest) return element;

            const closestRect = closest.getBoundingClientRect();
            const closestDistance = Math.abs(
              closestRect.top + closestRect.height / 2 - listCenter,
            );

            return distance < closestDistance ? element : closest;
          }, null);

        const anchorElement =
          (preferTopEdgeAnchor ? topEdgeAnchorElement : centerAnchorElement) ??
          messageElements[0];

        if (!anchorElement?.dataset.messageId) return null;

        return {
          id: anchorElement.dataset.messageId,
          offsetTop: anchorElement.getBoundingClientRect().top - listTop,
        };
      }),
    [listElement, loadMoreScrollThreshold, loadingMore],
  );

  const restoreAnchor = useCallback(
    (anchor: { id: string; offsetTop: number }) => {
      if (!listElement) return;

      anchorRestoreCleanupRef.current?.();

      let cancelled = false;
      let stableFrameCount = 0;
      let frameQueued = false;
      let resizeObserver: ResizeObserver | undefined;
      // eslint-disable-next-line prefer-const
      let settleTimeoutId: ReturnType<typeof setTimeout> | undefined;
      let animationFrameId: number | undefined;

      isRestoringOlderAnchorRef.current = true;

      const applyAnchor = () =>
        measureScrollWork('message-list-scroll:apply-anchor', () => {
          if (cancelled) return true;

          const anchorElement = listElement.querySelector<HTMLElement>(
            `[data-message-id='${anchor.id}']`,
          );
          if (!anchorElement) return true;

          const listTop = listElement.getBoundingClientRect().top;
          const nextOffsetTop = anchorElement.getBoundingClientRect().top - listTop;
          const offsetDelta = nextOffsetTop - anchor.offsetTop;

          if (Math.abs(offsetDelta) > 1) {
            listElement.scrollBy({ top: offsetDelta });
            return false;
          }

          return true;
        });

      const cleanup = () => {
        cancelled = true;
        frameQueued = false;
        isRestoringOlderAnchorRef.current = false;
        if (typeof animationFrameId !== 'undefined') {
          window.cancelAnimationFrame(animationFrameId);
        }
        if (settleTimeoutId) {
          clearTimeout(settleTimeoutId);
        }
        resizeObserver?.disconnect();
      };

      // Keep correcting against the same anchor until the DOM stops shifting.
      const queueNextFrame = () => {
        if (cancelled || frameQueued) return;
        frameQueued = true;
        animationFrameId = window.requestAnimationFrame(() => {
          frameQueued = false;
          const isStable = applyAnchor();
          stableFrameCount = isStable ? stableFrameCount + 1 : 0;

          if (stableFrameCount >= 2) {
            cleanup();
            return;
          }

          queueNextFrame();
        });
      };

      stableFrameCount = applyAnchor() ? 1 : 0;
      queueNextFrame();

      // Late media/layout updates can still move the anchor after the first
      // correction, so restart the settle check when the list resizes.
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          stableFrameCount = 0;
          queueNextFrame();
        });
        resizeObserver.observe(listElement);
      }

      settleTimeoutId = setTimeout(() => {
        cleanup();
      }, 1200);

      anchorRestoreCleanupRef.current = cleanup;
    },
    [listElement],
  );

  useLayoutEffect(
    () => () => {
      anchorRestoreCleanupRef.current?.();
    },
    [],
  );

  const scrollToBottom = useCallback(
    (options?: ScrollToOptions) => {
      if (
        !listElement?.scrollTo ||
        hasMoreNewer ||
        isRestoringOlderAnchorRef.current ||
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

    if (listElement && !disableAutoScrollToBottom && !isRestoringOlderAnchorRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableAutoScrollToBottom, justReachedLatestMessageSet, listElement, hasMoreNewer]);

  const updateScrollTop = useMessageListScrollManager({
    captureAnchor,
    disableScrollManagement: disableScrollManagement || isRestoringOlderAnchorRef.current,
    justReachedLatestMessageSet,
    loadingMore,
    loadMoreScrollThreshold,
    messages,
    onScrollBy: (scrollBy) => {
      listElement?.scrollBy({ top: scrollBy });
    },
    onScrollToTop: () => {
      if (!listElement) return;
      listElement.scrollTop = 0;
    },
    restoreAnchor,

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

      updateScrollTop(scrollTop, captureAnchor());

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
    [captureAnchor, updateScrollTop, closeToTop, closeToBottom, scrolledUpThreshold],
  );

  return {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};
