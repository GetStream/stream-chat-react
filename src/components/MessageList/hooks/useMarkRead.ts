import { useEffect } from 'react';
import { useChannelActionContext } from '../../../context';

type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean;
  messageListIsThread: boolean;
  unreadCount: number;
  wasChannelMarkedUnread: boolean;
};

/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param unreadCount
 * @param wasChannelMarkedUnread
 */
export const useMarkRead = ({
  isMessageListScrolledToBottom,
  messageListIsThread,
  unreadCount,
  wasChannelMarkedUnread,
}: UseMarkReadParams) => {
  const { markRead } = useChannelActionContext('useMarkRead');

  useEffect(() => {
    const shouldMarkRead =
      !messageListIsThread &&
      isMessageListScrolledToBottom &&
      !wasChannelMarkedUnread &&
      unreadCount > 0;

    const onVisibilityChange = () => {
      if (!document.hidden && shouldMarkRead) markRead();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead) markRead();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    isMessageListScrolledToBottom,
    markRead,
    messageListIsThread,
    unreadCount,
    wasChannelMarkedUnread,
  ]);
};
