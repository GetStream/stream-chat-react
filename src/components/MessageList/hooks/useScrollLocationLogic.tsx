import React, { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UseScrollLocationLogicParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  hasMoreNewer: boolean;
  listRef: RefObject<HTMLDivElement>;
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
    listRef,
    ulRef,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const scrollCounter = useRef({ autoScroll: 0, scroll: 0 });

  const scrollToBottom = useCallback(() => {
    if (!listRef.current?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    scrollCounter.current.autoScroll += 1;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
    });
    setHasNewMessages(false);
  }, [listRef, hasMoreNewer, suppressAutoscroll]);

  const resizeObserverState = useRef({
    observer: new ResizeObserver(scrollToBottom),
    observing: false,
  });

  useEffect(() => {
    if (!listRef.current) return;

    const cancelObserverOnUserScroll = () => {
      scrollCounter.current.scroll += 1;
      const userScrolled = scrollCounter.current.autoScroll < scrollCounter.current.scroll;
      if (ulRef.current && userScrolled && resizeObserverState.current.observing) {
        resizeObserverState.current.observer.unobserve(ulRef.current);
        resizeObserverState.current.observing = false;
      }
    };

    if (ulRef.current) {
      resizeObserverState.current.observer.observe(ulRef.current);
      resizeObserverState.current.observing = true;
    }

    listRef.current.addEventListener('scroll', cancelObserverOnUserScroll);

    return () => {
      if (ulRef.current) {
        resizeObserverState.current.observer.unobserve(ulRef.current);
      }
      if (listRef.current) {
        listRef.current.removeEventListener('scroll', cancelObserverOnUserScroll);
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
