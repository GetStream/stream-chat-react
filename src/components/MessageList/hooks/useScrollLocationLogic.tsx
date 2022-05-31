import React, { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UseScrollLocationLogicParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  hasMoreNewer: boolean;
  suppressAutoscroll: boolean;
  ulRef: RefObject<HTMLUListElement>;
  currentUserId?: string;
  messages?: StreamMessage<StreamChatGenerics>[];
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseScrollLocationLogicParams<StreamChatGenerics>,
) => {
  const {
    messages = [],
    scrolledUpThreshold = 200,
    hasMoreNewer,
    suppressAutoscroll,
    ulRef,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const userInteraction = React.useRef({ clickedScrollBar: false, performedScroll: false });

  const scrollToBottom = useCallback(() => {
    if (!listRef.current?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
    });
    setHasNewMessages(false);
  }, [listRef, hasMoreNewer, suppressAutoscroll]);

  const resizeObserver = useRef(new ResizeObserver(scrollToBottom));

  useEffect(() => {
    if (!listRef.current) return;

    const cancelObserverOnUserScrollActivity = (
      e: WheelEvent | TouchEvent | KeyboardEvent | MouseEvent | Event,
    ) => {
      if (!listRef.current) return;

      const msgListIsScrollableVertically =
        listRef.current.offsetHeight <= listRef.current.scrollHeight;
      const notLeftBtnClick = e instanceof MouseEvent && e.type === 'mouseDown' && e.buttons !== 1;
      const notClickedScrollBar =
        e instanceof MouseEvent && e.buttons === 1 && e.offsetX < listRef.current.clientWidth;

      if (
        !msgListIsScrollableVertically ||
        userInteraction.current.performedScroll ||
        notLeftBtnClick ||
        notClickedScrollBar
      ) {
        return;
      }

      const clickedOnScrollBar =
        e instanceof MouseEvent && e.buttons === 1 && listRef.current.clientWidth < e.offsetX;

      if (clickedOnScrollBar) {
        userInteraction.current.clickedScrollBar = true;
        return;
      }

      if (
        (e.type === 'scroll' && userInteraction.current.clickedScrollBar) ||
        (e instanceof KeyboardEvent && e.key === 'ArrowUp') ||
        e instanceof WheelEvent ||
        e instanceof TouchEvent
      ) {
        if (ulRef.current) resizeObserver.current.unobserve(ulRef.current);
        userInteraction.current.performedScroll = true;
      }
    };

    if (ulRef.current && !userInteraction.current.performedScroll) {
      resizeObserver.current.observe(ulRef.current);
    }

    listRef.current.addEventListener('wheel', cancelObserverOnUserScrollActivity, {
      once: true,
      passive: true,
    });
    listRef.current.addEventListener('touchmove', cancelObserverOnUserScrollActivity, {
      once: true,
      passive: true,
    });
    listRef.current.addEventListener('keydown', cancelObserverOnUserScrollActivity);
    listRef.current.addEventListener('mousedown', cancelObserverOnUserScrollActivity, {
      passive: true,
    });
    listRef.current.addEventListener('scroll', cancelObserverOnUserScrollActivity);
    return () => {
      if (ulRef.current) resizeObserver.current.unobserve(ulRef.current);
      if (listRef.current) {
        listRef.current.removeEventListener('wheel', cancelObserverOnUserScrollActivity);
        listRef.current.removeEventListener('touchmove', cancelObserverOnUserScrollActivity);
        listRef.current.removeEventListener('keydown', cancelObserverOnUserScrollActivity);
        listRef.current.removeEventListener('mousedown', cancelObserverOnUserScrollActivity);
        listRef.current.removeEventListener('scroll', cancelObserverOnUserScrollActivity);
      }
    };
  }, [listRef.current, ulRef.current]);

  useLayoutEffect(() => {
    if (listRef?.current) {
      setWrapperRect(listRef.current.getBoundingClientRect());
    }
  }, [listRef.current, hasMoreNewer]);

  const updateScrollTop = useMessageListScrollManager({
    messages,
    onScrollBy: (scrollBy) => {
      listRef.current?.scrollBy({ top: scrollBy });
    },

    scrollContainerMeasures: () => ({
      offsetHeight: listRef.current?.offsetHeight || 0,
      scrollHeight: listRef.current?.scrollHeight || 0,
    }),
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages: () => setHasNewMessages(true),
  });

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const element = event.target as HTMLDivElement;
      const scrollTop = element.scrollTop;

      updateScrollTop(scrollTop);

      const offsetHeight = element.offsetHeight;
      const scrollHeight = element.scrollHeight;

      closeToBottom.current = scrollHeight - (scrollTop + offsetHeight) < scrolledUpThreshold;
      closeToTop.current = scrollTop < scrolledUpThreshold;

      if (closeToBottom.current) {
        setHasNewMessages(false);
      }
    },
    [updateScrollTop, closeToTop, closeToBottom, scrolledUpThreshold],
  );

  const onMessageLoadCaptured = useCallback(() => {
    /**
     * A load event (emitted by e.g. an <img>) was captured on a message.
     * In some cases, the loaded asset is larger than the placeholder, which means we have to scroll down.
     */
    if (closeToBottom.current && !closeToTop.current) {
      scrollToBottom();
    }
  }, [closeToTop, closeToBottom, scrollToBottom]);

  return {
    hasNewMessages,
    listRef,
    onMessageLoadCaptured,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};
