import { useChannelStateContext } from '../../../../context';
import { useEffect, useRef, useState } from 'react';
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from '../../MessageListMainPanel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from '../../UnreadMessagesSeparator';

const targetScrolledAboveVisibleContainerArea = (
  element: Element,
  container?: Element,
) => {
  const { bottom: targetBottom } = element.getBoundingClientRect();
  const containerTop = container?.getBoundingClientRect().top ?? 0;
  return targetBottom < containerTop;
};

const targetScrolledBelowVisibleContainerArea = (
  element: Element,
  container: Element,
) => {
  const { top: targetTop } = element.getBoundingClientRect();
  const { bottom: containerBottom } = container.getBoundingClientRect();
  return targetTop > containerBottom;
};

export type UseUnreadMessagesNotificationParams = {
  /** Scroll container (the element with overflow that actually scrolls). When provided, used as IntersectionObserver root and for initial visibility. */
  listElement: HTMLDivElement | null;
  isMessageListScrolledToBottom: boolean;
  showAlways: boolean;
  unreadCount?: number;
};

export const useUnreadMessagesNotification = ({
  isMessageListScrolledToBottom,
  listElement,
  showAlways,
  unreadCount,
}: UseUnreadMessagesNotificationParams) => {
  const { messages } = useChannelStateContext('UnreadMessagesNotification');
  const [show, setShow] = useState(false);
  const isScrolledAboveTargetTop = useRef(false);
  const intersectionObserverIsSupported = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!(unreadCount && intersectionObserverIsSupported)) {
      setShow(false);
      return;
    }

    const scrollRoot = listElement ?? null;
    if (!scrollRoot) {
      const [msgListPanel] = document.getElementsByClassName(
        MESSAGE_LIST_MAIN_PANEL_CLASS,
      );
      if (!msgListPanel) return;
      const [observedTarget] = document.getElementsByClassName(
        UNREAD_MESSAGE_SEPARATOR_CLASS,
      );
      if (!observedTarget) {
        setShow(true);
      }
      return;
    }

    const [observedTarget] = document.getElementsByClassName(
      UNREAD_MESSAGE_SEPARATOR_CLASS,
    );
    if (!observedTarget) {
      setShow(true);
      return;
    }

    const scrolledBelowSeparator = targetScrolledAboveVisibleContainerArea(
      observedTarget,
      scrollRoot,
    );
    const scrolledAboveSeparator = targetScrolledBelowVisibleContainerArea(
      observedTarget,
      scrollRoot,
    );

    setShow(
      showAlways
        ? scrolledBelowSeparator || scrolledAboveSeparator
        : scrolledBelowSeparator,
    );

    const observer = new IntersectionObserver(
      (elements) => {
        if (!elements.length) return;
        const entry = elements[0];
        const { boundingClientRect, isIntersecting, rootBounds } = entry;
        if (isIntersecting) {
          setShow(false);
          return;
        }
        const rootTop = rootBounds?.top ?? 0;
        const separatorIsAboveContainerTop = boundingClientRect.bottom < rootTop;
        setShow(showAlways || separatorIsAboveContainerTop);
        isScrolledAboveTargetTop.current = separatorIsAboveContainerTop;
      },
      { root: scrollRoot },
    );
    observer.observe(observedTarget);

    return () => {
      observer.disconnect();
    };
  }, [
    intersectionObserverIsSupported,
    listElement,
    isMessageListScrolledToBottom,
    messages,
    showAlways,
    unreadCount,
  ]);

  useEffect(() => {
    /**
     * Handle situation when scrollToBottom is called from another component when the msg list is scrolled above the observed target (unread separator).
     * The intersection observer is not triggered when Element.scrollTo() is called. So we end up in a situation when we are scrolled to the bottom
     * and at the same time scrolled above the observed target.
     */

    if (
      unreadCount &&
      isMessageListScrolledToBottom &&
      isScrolledAboveTargetTop.current
    ) {
      setShow(true);
      isScrolledAboveTargetTop.current = false;
    }
  }, [isMessageListScrolledToBottom, unreadCount]);

  return { show: show && intersectionObserverIsSupported };
};
