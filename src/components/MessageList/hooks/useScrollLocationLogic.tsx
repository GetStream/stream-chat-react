import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';

import { useMessageListScrollManager } from './useMessageListScrollManager';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

const isBrowser = typeof window !== 'undefined';
const ResizeObserver = (isBrowser && window.ResizeObserver) || Polyfill;

export type UseScrollLocationLogicParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  hasMoreNewer: boolean;
  listElement: HTMLDivElement | null;
  suppressAutoscroll: boolean;
  ulElement: HTMLUListElement | null;
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
    listElement,
    ulElement,
  } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const scrollCounter = useRef({ autoScroll: 0, scroll: 0 });

  const scrollToBottom = useCallback(() => {
    if (!listElement?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    scrollCounter.current.autoScroll += 1;
    listElement.scrollTo({
      top: listElement.scrollHeight,
    });
    setHasNewMessages(false);
  }, [listElement, hasMoreNewer, suppressAutoscroll]);

  useEffect(() => {
    if (!listElement) return;
    const observer = new ResizeObserver(scrollToBottom);

    const cancelObserverOnUserScroll = () => {
      scrollCounter.current.scroll += 1;
      const userScrolled = scrollCounter.current.autoScroll < scrollCounter.current.scroll;
      if (ulElement && userScrolled) {
        observer.unobserve(ulElement);
        listElement?.removeEventListener('scroll', cancelObserverOnUserScroll);
      }
    };

    if (ulElement) {
      observer.observe(ulElement);
    }

    listElement.addEventListener('scroll', cancelObserverOnUserScroll);

    return () => {
      observer.disconnect();

      if (listElement) {
        listElement.removeEventListener('scroll', cancelObserverOnUserScroll);
      }
    };
  }, [ulElement, scrollToBottom]);

  useLayoutEffect(() => {
    if (listElement) {
      setWrapperRect(listElement.getBoundingClientRect());
      scrollToBottom();
    }
  }, [listElement, hasMoreNewer]);

  const updateScrollTop = useMessageListScrollManager({
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
    onMessageLoadCaptured,
    onScroll,
    scrollToBottom,
    wrapperRect,
  };
};
