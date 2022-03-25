import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useMessageListScrollManager } from './useMessageListScrollManager';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type UseScrollLocationLogicParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  hasMoreNewer: boolean;
  suppressAutoscroll: boolean;
  currentUserId?: string;
  messages?: StreamMessage<StreamChatGenerics>[];
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: UseScrollLocationLogicParams<StreamChatGenerics>,
) => {
  const { messages = [], scrolledUpThreshold = 200, hasMoreNewer, suppressAutoscroll } = params;

  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();

  const closeToBottom = useRef(false);
  const closeToTop = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (!listRef.current?.scrollTo || hasMoreNewer || suppressAutoscroll) {
      return;
    }

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
    });
    setHasNewMessages(false);

    // this is hacky and unreliable, but that was the current implementation so not breaking it
    setTimeout(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
      });
    }, 200);
  }, [listRef, hasMoreNewer, suppressAutoscroll]);

  useLayoutEffect(() => {
    if (listRef?.current) {
      setWrapperRect(listRef.current.getBoundingClientRect());
      scrollToBottom();
    }
  }, [listRef, hasMoreNewer]);

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
