import { useChannelStateContext } from '../../../../context';
import { useEffect, useRef, useState } from 'react';
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from '../../MessageListMainPanel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from '../../UnreadMessagesSeparator';

const targetIsVisibleInContainer = (element: Element, container: Element) => {
  const { height: msgListHeight } = container.getBoundingClientRect();
  const { y: targetMessageY } = element.getBoundingClientRect();
  return 0 <= targetMessageY && targetMessageY <= msgListHeight;
};

export type UseUnreadMessagesNotificationParams = {
  isMessageListScrolledToBottom: boolean;
  unreadCount?: number;
};

export const useUnreadMessagesNotification = ({
  isMessageListScrolledToBottom,
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

    const msgListPanel = document.querySelector(`.${MESSAGE_LIST_MAIN_PANEL_CLASS}`);
    if (!msgListPanel) return;

    const observedTarget = document.querySelector(`.${UNREAD_MESSAGE_SEPARATOR_CLASS}`);
    if (!observedTarget) {
      setShow(true);
      return;
    }

    setShow(!targetIsVisibleInContainer(observedTarget, msgListPanel));

    const observer = new IntersectionObserver(
      (elements) => {
        if (!elements.length) return;
        const { boundingClientRect, isIntersecting, rootBounds } = elements[0];
        const isScrolledAboveTargetTopCurrent = !!(
          rootBounds &&
          boundingClientRect &&
          rootBounds.bottom < boundingClientRect.top
        );
        setShow(!isIntersecting && !isScrolledAboveTargetTopCurrent);
        isScrolledAboveTargetTop.current = isScrolledAboveTargetTopCurrent;
      },
      { root: msgListPanel },
    );
    observer.observe(observedTarget);

    return () => {
      observer.disconnect();
    };
  }, [intersectionObserverIsSupported, messages, unreadCount]);

  useEffect(() => {
    /**
     * Handle situation when scrollToBottom is called from another component when the msg list is scrolled above the observed target (unread separator).
     * The intersection observer is not triggered when Element.scrollTo() is called. So we end up in a situation when we are scrolled to the bottom
     * and at the same time scrolled above the observed target.
     */

    if (unreadCount && isMessageListScrolledToBottom && isScrolledAboveTargetTop.current) {
      setShow(true);
      isScrolledAboveTargetTop.current = false;
    }
  }, [isMessageListScrolledToBottom, unreadCount]);

  return { show: show && intersectionObserverIsSupported };
};
