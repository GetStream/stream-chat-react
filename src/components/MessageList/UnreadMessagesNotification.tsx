import React, { useEffect, useState } from 'react';
import { CloseIcon } from './icons';
import {
  useChannelActionContext,
  useChannelStateContext,
  useTranslationContext,
} from '../../context';
import { MESSAGE_LIST_MAIN_PANEL_CLASS } from './MessageListMainPanel';
import { UNREAD_MESSAGE_SEPARATOR_CLASS } from './UnreadMessagesSeparator';

const targetIsVisibleInContainer = (element: Element, container: Element) => {
  const { height: msgListHeight } = container.getBoundingClientRect();
  const { y: targetMessageY } = element.getBoundingClientRect();
  return 0 <= targetMessageY && targetMessageY <= msgListHeight;
};

export type UnreadMessagesNotificationProps = {
  firstUnreadMessageId?: string;
  unreadCount?: number;
};

export const UnreadMessagesNotification = ({
  firstUnreadMessageId,
  unreadCount,
}: UnreadMessagesNotificationProps) => {
  const { messages } = useChannelStateContext('UnreadMessagesNotification');
  const { jumpToMessage, markRead } = useChannelActionContext('UnreadMessagesNotification');
  const { t } = useTranslationContext('UnreadMessagesNotification');
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!(firstUnreadMessageId && IntersectionObserver)) {
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

  if (!(show && firstUnreadMessageId && unreadCount && IntersectionObserver)) return null;

  return (
    <div className='str-chat__unread-messages-notification'>
      <button onClick={() => jumpToMessage(firstUnreadMessageId)}>
        {t<string>('{{count}} unread', { count: unreadCount })}
      </button>
      <button onClick={markRead}>
        <CloseIcon />
      </button>
    </div>
  );
};
