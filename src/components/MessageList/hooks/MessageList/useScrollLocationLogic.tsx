import type React from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';
import type { LocalMessage } from 'stream-chat';

const getOffsetFromDocument = (element: HTMLElement) => {
  let top = 0;
  let current: HTMLElement | null = element;
  while (current) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
};

// Distance of `element`'s top edge from the top of `container`'s scrollable content. Built from
// `offsetTop`, which ignores the container's scroll position.
const getOffsetWithin = (element: HTMLElement, container: HTMLElement) =>
  getOffsetFromDocument(element) - getOffsetFromDocument(container) - container.clientTop;

// A touch fling on iOS WebKit overrides programmatic scroll positions every frame; hiding the
// overflow ends it. The scrollbar is an overlay there, so the toggle does not shift the layout.
// `-webkit-touch-callout` is iOS-only, which keeps the toggle off desktop browsers.
const supportsMomentumScrolling = () =>
  typeof CSS !== 'undefined' && !!CSS.supports?.('-webkit-touch-callout', 'none');

const stopMomentumScrolling = (element: HTMLElement) => {
  if (!supportsMomentumScrolling()) return undefined;

  const previousOverflowY = element.style.overflowY;
  element.style.overflowY = 'hidden';

  return () => {
    element.style.overflowY = previousOverflowY;
  };
};

export type UseScrollLocationLogicParams = {
  hasMoreNewer: boolean;
  listElement: HTMLElement | null;
  loadMoreScrollThreshold: number;
  /** Whether a page load is in progress. */
  loadingMore?: boolean;
  suppressAutoscroll?: boolean;
  messages?: LocalMessage[];
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = (params: UseScrollLocationLogicParams) => {
  const {
    hasMoreNewer,
    listElement,
    loadingMore = false,
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
  const isRestoringOlderAnchorRef = useRef(false);
  const anchorRestoreCleanupRef = useRef<(() => void) | null>(null);

  // `hasMoreNewer` turning false means the loaded window just reached the live head, e.g. the page
  // bridging a jump (a search result deep in history) arrived. The viewport must not move: the
  // merged page lands below the reader, and treating it like a mount or a new message would
  // teleport them to the newest message. Both autoscroll paths below skip this one render.
  const previousHasMoreNewer = useRef(hasMoreNewer);
  const justReachedLatestMessageSet = previousHasMoreNewer.current && !hasMoreNewer;

  const captureAnchor = useCallback(() => {
    if (!listElement) return null;

    const listRect = listElement.getBoundingClientRect();
    const listTop = listRect.top;
    const listBottom = listRect.bottom;
    const listCenter = listTop + listRect.height / 2;
    // Older-page pagination anchors to the top edge, every other case to the center.
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

      // Held until the restore settles: the fling would reclaim the position on frames we skip.
      let resumeScrolling: (() => void) | undefined;

      const applyAnchor = () => {
        if (cancelled) return true;

        const anchorElement = listElement.querySelector<HTMLElement>(
          `[data-message-id='${anchor.id}']`,
        );
        if (!anchorElement) return true;

        // The absolute target comes from layout (`offsetTop` ignores scroll), so re-applying it is
        // idempotent. A relative `scrollBy` correction oscillates on iOS WebKit, where geometry
        // read in the frame after a scroll still reflects the old position.
        const targetScrollTop =
          getOffsetWithin(anchorElement, listElement) - anchor.offsetTop;

        if (Math.abs(listElement.scrollTop - targetScrollTop) > 1) {
          resumeScrolling ??= stopMomentumScrolling(listElement);
          listElement.scrollTop = targetScrollTop;
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
        resumeScrolling?.();
        resumeScrolling = undefined;
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

      // Late media or layout changes can move the anchor again, so a resize restarts the settle
      // check.
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

  // Callers opt into animation with `{ behavior }`. The autoscroll paths below pass nothing and
  // stay instant, which keeps pagination position preservation correct.
  const scrollToBottom = useCallback(
    (options?: { behavior?: ScrollBehavior }) => {
      if (
        !listElement?.scrollTo ||
        hasMoreNewer ||
        isRestoringOlderAnchorRef.current ||
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
    [listElement, hasMoreNewer, suppressAutoscroll],
  );

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
      // `hasMoreNewer` is a dependency so a list mounted before its first page still autoscrolls
      // once it resolves. That also runs on the merge into the live head, which must not scroll.
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
    captureAnchor,
    // Another adjustment while the anchor is being restored would fight it for the position.
    disableScrollManagement: isRestoringOlderAnchorRef.current,
    justReachedLatestMessageSet,
    loadingMore,
    loadMoreScrollThreshold,
    messages,
    onScrollBy: (scrollBy) => {
      listElement?.scrollBy({ top: scrollBy });
    },
    onScrollToTop: () => {
      listElement?.scrollTo({ top: 0 });
    },
    restoreAnchor,

    scrollContainerMeasures: () => ({
      offsetHeight: listElement?.offsetHeight || 0,
      scrollHeight: listElement?.scrollHeight || 0,
      scrollTop: listElement?.scrollTop || 0,
    }),
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages: () => setHasNewMessages(true),
    suppressAutoscroll,
  });

  // Declared after the autoscroll layout effects and the scroll manager's, so all of them see the
  // transition before it is consumed.
  useLayoutEffect(() => {
    previousHasMoreNewer.current = hasMoreNewer;
  }, [hasMoreNewer]);

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      const element = event.target as HTMLElement;
      const scrollTop = element.scrollTop;

      updateScrollTop(scrollTop, captureAnchor);

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
    [updateScrollTop, captureAnchor, closeToTop, closeToBottom, scrolledUpThreshold],
  );

  return {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};
