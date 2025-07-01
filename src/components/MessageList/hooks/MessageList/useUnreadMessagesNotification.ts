import { useChannelStateContext } from '../../../../context';
import { useEffect, useRef, useState } from 'react';
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from '../../MessageListMainPanel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from '../../UnreadMessagesSeparator';

const targetScrolledAboveVisibleContainerArea = (element: Element) => {
  const { bottom: targetBottom } = element.getBoundingClientRect();
  return targetBottom < 0;
};

const targetScrolledBelowVisibleContainerArea = (
  element: Element,
  container: Element,
) => {
  const { top: targetTop } = element.getBoundingClientRect();
  const { top: containerBottom } = container.getBoundingClientRect();
  return targetTop > containerBottom;
};

export type UseUnreadMessagesNotificationParams = {
  isMessageListScrolledToBottom: boolean;
  showAlways: boolean;
  unreadCount?: number;
};

export const useUnreadMessagesNotification = ({
  isMessageListScrolledToBottom,
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

    const [msgListPanel] = document.getElementsByClassName(MESSAGE_LIST_MAIN_PANEL_CLASS);
    if (!msgListPanel) return;

    const [observedTarget] = document.getElementsByClassName(
      UNREAD_MESSAGE_SEPARATOR_CLASS,
    );
    if (!observedTarget) {
      setShow(true);
      return;
    }

    const scrolledBelowSeparator =
      targetScrolledAboveVisibleContainerArea(observedTarget);
    const scrolledAboveSeparator = targetScrolledBelowVisibleContainerArea(
      observedTarget,
      msgListPanel,
    );

    setShow(
      showAlways
        ? scrolledBelowSeparator || scrolledAboveSeparator
        : scrolledBelowSeparator,
    );

    const observer = new IntersectionObserver(
      (elements) => {
        if (!elements.length) return;
        const { boundingClientRect, isIntersecting } = elements[0];
        if (isIntersecting) {
          setShow(false);
          return;
        }
        const separatorIsAboveContainerTop = boundingClientRect.bottom < 0;
        setShow(showAlways || separatorIsAboveContainerTop);
        isScrolledAboveTargetTop.current = separatorIsAboveContainerTop;
      },
      { root: msgListPanel },
    );
    observer.observe(observedTarget);

    return () => {
      observer.disconnect();
    };
  }, [
    intersectionObserverIsSupported,
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
