import { useChannelStateContext } from '../../../../context';
import { useEffect, useState } from 'react';
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from '../../MessageListMainPanel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from '../../UnreadMessagesSeparator';

const targetIsVisibleInContainer = (element: Element, container: Element) => {
  const { height: msgListHeight } = container.getBoundingClientRect();
  const { y: targetMessageY } = element.getBoundingClientRect();
  return 0 <= targetMessageY && targetMessageY <= msgListHeight;
};

export type UseUnreadMessagesNotificationParams = {
  firstUnreadMessageId?: string;
};

export const useUnreadMessagesNotification = ({
  firstUnreadMessageId,
}: UseUnreadMessagesNotificationParams) => {
  const { messages } = useChannelStateContext('UnreadMessagesNotification');
  const [show, setShow] = useState(false);
  const intersectionObserverIsSupported = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!(firstUnreadMessageId && intersectionObserverIsSupported)) {
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
        const isScrolledAboveTargetTop =
          rootBounds && boundingClientRect && rootBounds.bottom < boundingClientRect.top;
        setShow(!isIntersecting && !isScrolledAboveTargetTop);
      },
      { root: msgListPanel },
    );
    observer.observe(observedTarget);

    return () => {
      observer.disconnect();
    };
  }, [firstUnreadMessageId, messages]);

  return { show: show && intersectionObserverIsSupported };
};
