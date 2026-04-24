import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';
import type { LocalMessage } from 'stream-chat';

export type UseScrollLocationLogicParams = {
  /** Disables automatic scroll-to-bottom updates after message changes. */
  disableAutoScrollToBottom?: boolean;
  /** Disables scroll-management adjustments (anchor restore, append/prepend handling). */
  disableScrollManagement?: boolean;
  /** True when there are newer messages to load beyond the currently rendered page. */
  hasMoreNewer: boolean;
  /** Scrollable message-list container element. */
  listElement: HTMLDivElement | null;
  /** Threshold used to detect older-page pagination proximity near the top. */
  loadMoreScrollThreshold: number;
  /** Indicates whether older-page pagination is currently in progress. */
  loadingMore?: boolean;
  /** Hard-disable all autoscroll behavior. */
  suppressAutoscroll: boolean;
  /** Current rendered message set used for scroll reconciliation. */
  messages?: LocalMessage[];
  /** Distance from bottom (px) considered as "near bottom". */
  scrolledUpThreshold?: number;
};

/**
 * Centralized scroll-position logic for MessageList.
 *
 * Responsibilities:
 * - Keep viewport stable during prepend/append pagination updates.
 * - Track whether the list is near bottom and expose that state to UI.
 * - Auto-scroll to bottom when appropriate while respecting suppression flags.
 * - Perform a short hydration settle pass so freshly loaded lists land at bottom.
 */
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
  const previousMessagesLengthRef = useRef(messages.length);
  const previousDisableAutoScrollToBottomRef = useRef(disableAutoScrollToBottom);
  const previousDisableAutoScrollSettleRef = useRef(disableAutoScrollToBottom);
  const anchorRestoreCleanupRef = useRef<(() => void) | null>(null);

  const captureAnchor = useCallback(() => {
    if (!listElement) return null;

    const listRect = listElement.getBoundingClientRect();
    const listTop = listRect.top;
    const listBottom = listRect.bottom;
    const listCenter = listTop + listRect.height / 2;
    // Older-page pagination should track the top edge, while the generic
    // “keep this viewport stable” case works better from the center.
    const preferTopEdgeAnchor =
      loadingMore || listElement.scrollTop < loadMoreScrollThreshold;
    const messageElements = Array.from(
      listElement.querySelectorAll<HTMLElement>('[data-message-id]'),
    );
    const messageAnchors = messageElements.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        center: rect.top + rect.height / 2,
        element,
        offsetTop: rect.top - listTop,
        rect,
      };
    });

    const visibleMessageAnchors = messageAnchors.filter(
      ({ rect }) => rect.bottom > listTop && rect.top < listBottom,
    );

    const topEdgeAnchor = visibleMessageAnchors.reduce<
      (typeof visibleMessageAnchors)[number] | null
    >((closest, candidate) => {
      if (!closest || candidate.rect.top < closest.rect.top) {
        return candidate;
      }

      return closest;
    }, null);

    const centerAnchor =
      visibleMessageAnchors.find(
        ({ rect }) => rect.top <= listCenter && rect.bottom >= listCenter,
      ) ??
      visibleMessageAnchors.reduce<(typeof visibleMessageAnchors)[number] | null>(
        (closest, candidate) => {
          if (!closest) return candidate;

          const distance = Math.abs(candidate.center - listCenter);
          const closestDistance = Math.abs(closest.center - listCenter);

          return distance < closestDistance ? candidate : closest;
        },
        null,
      );

    const anchor =
      (preferTopEdgeAnchor ? topEdgeAnchor : centerAnchor) ?? messageAnchors[0];

    if (!anchor?.element.dataset.messageId) return null;

    return {
      id: anchor.element.dataset.messageId,
      offsetTop: anchor.offsetTop,
    };
  }, [listElement, loadMoreScrollThreshold, loadingMore]);

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

      const applyAnchor = () => {
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
      };

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

  /**
   * Keeps wrapper geometry up to date and handles the "reached latest merged set"
   * path where existing viewport position must be preserved.
   */
  useLayoutEffect(() => {
    const disableAutoScrollJustReleased =
      previousDisableAutoScrollToBottomRef.current && !disableAutoScrollToBottom;
    previousDisableAutoScrollToBottomRef.current = disableAutoScrollToBottom;

    // Re-enabling auto-scroll should not immediately force a jump to bottom.
    // This avoids snap-back after temporary suppression (e.g. jump-to-message).
    if (disableAutoScrollJustReleased) {
      return;
    }

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

  /**
   * Short post-render bottom settle. This is intentionally small (immediate + 2 retries)
   * to catch late layout updates without keeping the list in a prolonged lock loop.
   */
  useLayoutEffect(() => {
    const disableAutoScrollJustReleased =
      previousDisableAutoScrollSettleRef.current && !disableAutoScrollToBottom;
    previousDisableAutoScrollSettleRef.current = disableAutoScrollToBottom;

    // Skip one settle cycle when auto-scroll suppression is released.
    // Without this guard, a jump-to-message flow can scroll to the target and then
    // get pulled back down by the delayed "keep pinned to bottom" retries
    // (80/260/420/900/1700ms), which looks like a snap-back to the latest message.
    // Letting this transition frame pass preserves the jump destination.
    if (disableAutoScrollJustReleased) {
      return;
    }

    if (
      !listElement ||
      disableAutoScrollToBottom ||
      hasMoreNewer ||
      suppressAutoscroll ||
      justReachedLatestMessageSet ||
      isRestoringOlderAnchorRef.current
    ) {
      return;
    }

    const initialDistanceToBottom =
      listElement.scrollHeight - (listElement.scrollTop + listElement.clientHeight);
    const messagesHydrated =
      previousMessagesLengthRef.current === 0 && messages.length > 0;

    if (initialDistanceToBottom > scrolledUpThreshold && !messagesHydrated) {
      return;
    }

    let keepPinnedToBottom = true;

    const maybeScrollToBottom = () => {
      if (keepPinnedToBottom) {
        scrollToBottom();
      }
    };

    maybeScrollToBottom();
    const settleDelays = [80, messagesHydrated ? 260 : 420, 900, 1700];
    const settleTimeoutIds = settleDelays.map((delay) =>
      setTimeout(maybeScrollToBottom, delay),
    );

    const stopKeepingPinnedToBottom = () => {
      keepPinnedToBottom = false;
    };

    // Any direct user interaction with the scroller disables the temporary
    // initial-load pin, so manual scrolling is never force-overridden.
    listElement.addEventListener('pointerdown', stopKeepingPinnedToBottom, {
      passive: true,
    });
    listElement.addEventListener('touchstart', stopKeepingPinnedToBottom, {
      passive: true,
    });
    listElement.addEventListener('wheel', stopKeepingPinnedToBottom, {
      passive: true,
    });
    listElement.addEventListener('keydown', stopKeepingPinnedToBottom);

    const pinWindowTimeoutId = setTimeout(() => {
      stopKeepingPinnedToBottom();
    }, 2200);

    return () => {
      settleTimeoutIds.forEach(clearTimeout);
      clearTimeout(pinWindowTimeoutId);
      listElement.removeEventListener('pointerdown', stopKeepingPinnedToBottom);
      listElement.removeEventListener('touchstart', stopKeepingPinnedToBottom);
      listElement.removeEventListener('wheel', stopKeepingPinnedToBottom);
      listElement.removeEventListener('keydown', stopKeepingPinnedToBottom);
    };
  }, [
    disableAutoScrollToBottom,
    hasMoreNewer,
    justReachedLatestMessageSet,
    listElement,
    messages.length,
    scrollToBottom,
    scrolledUpThreshold,
    suppressAutoscroll,
  ]);

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
    if (!listElement) return;

    const initialScrollTop = listElement.scrollTop;
    previousScrollTopRef.current = initialScrollTop;
    // Keep pagination mode selection in sync with the actual initial DOM position.
    updateScrollTop(initialScrollTop, null);
  }, [listElement, updateScrollTop]);

  useLayoutEffect(() => {
    previousHasMoreNewerRef.current = hasMoreNewer;
  }, [hasMoreNewer]);

  useLayoutEffect(() => {
    previousMessagesLengthRef.current = messages.length;
  }, [messages.length]);

  /**
   * Updates cached scroll metrics and bottom/top proximity state used by
   * notifications, autoscroll decisions, and paginator behavior.
   */
  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.target as HTMLDivElement;
      const scrollTop = element.scrollTop;
      previousScrollTopRef.current = scrollTop;

      updateScrollTop(scrollTop, captureAnchor);

      const offsetHeight = element.offsetHeight;
      const scrollHeight = element.scrollHeight;
      const distanceToBottom = scrollHeight - (scrollTop + offsetHeight);
      const bottomEnterThreshold = Math.max(Math.floor(scrolledUpThreshold * 0.6), 24);

      const prevCloseToBottom = closeToBottom.current;
      closeToBottom.current = prevCloseToBottom
        ? distanceToBottom < scrolledUpThreshold
        : distanceToBottom < bottomEnterThreshold;
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
