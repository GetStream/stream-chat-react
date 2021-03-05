import React, { useLayoutEffect, useRef, useState } from 'react';
import { useMessageListScrollManager } from './useMessageListScrollManager';

export type UseScrollLocationLogicArgs = {
  currentUserId?: string;
  messages?: Array<{ id?: string; user?: null | { id?: string } }>;
  scrolledUpThreshold?: number;
};

export const useScrollLocationLogic = ({
  currentUserId,
  messages = [],
  scrolledUpThreshold = 200,
}: UseScrollLocationLogicArgs) => {
  const [wrapperRect, setWrapperRect] = useState<DOMRect>();
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const closeToTop = useRef(false);
  const closeToBottom = useRef(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    if (!ref.current?.scrollTo) return;

    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
    });
    setHasNewMessages(false);

    // this is hacky and unreliable, but that was the current implementation so not breaking it
    setTimeout(() => {
      ref.current?.scrollTo({
        top: ref.current.scrollHeight,
      });
    }, 200);
  }, [ref]);

  useLayoutEffect(() => {
    if (ref && ref.current) {
      setWrapperRect(ref.current.getBoundingClientRect());
      scrollToBottom();
    }
  }, [ref]);

  const updateScrollTop = useMessageListScrollManager<typeof messages[number]>({
    currentUserId: () => currentUserId,
    messageId: (message) => message?.id,
    messages,
    messageUserId: (message) => message?.user?.id,
    onNewMessages: () => setHasNewMessages(true),
    onScrollBy: (scrollBy) => ref.current?.scrollBy({ top: scrollBy }),
    onScrollToBottom: scrollToBottom,
    scrollContainerMeasures: () => ({
      offsetHeight: ref.current?.offsetHeight || 0,
      scrollHeight: ref.current?.scrollHeight || 0,
    }),
    toleranceThreshold: scrolledUpThreshold,
  });

  const onScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.target as HTMLDivElement;
      const scrollTop = el.scrollTop;
      updateScrollTop(scrollTop);

      const offsetHeight = el.offsetHeight;
      const scrollHeight = el.scrollHeight;
      closeToBottom.current = scrollHeight - (scrollTop + offsetHeight) < scrolledUpThreshold;
      closeToTop.current = scrollTop < scrolledUpThreshold;

      if (closeToBottom.current) {
        setHasNewMessages(false);
      }
    },
    [updateScrollTop, closeToTop, closeToBottom, scrolledUpThreshold],
  );

  const onMessageLoadCaptured = React.useCallback(() => {
    // A load event (emitted by e.g. an <img>) was captured on a message.
    // In some cases, the loaded asset is larger than the placeholder, which means we have to scroll down.
    if (closeToBottom.current && !closeToTop.current) {
      scrollToBottom();
    }
  }, [closeToTop, closeToBottom, scrollToBottom]);

  return {
    hasNewMessages,
    onMessageLoadCaptured,
    onScroll,
    ref,
    scrollToBottom,
    wrapperRect,
  };
};
