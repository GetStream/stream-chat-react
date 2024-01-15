import { useEffect } from 'react';
import { useChannelActionContext, useChannelStateContext } from '../../../context';

type UseMarkReadParams = {
  isMessageListScrolledToBottom: boolean;
  messageListIsThread: boolean;
  wasChannelMarkedUnread: boolean;
};

/**
 * Takes care of marking a channel read. The channel is read only if all the following applies:
 * 1. the message list is not rendered in a thread
 * 2. the message list is scrolled to the bottom
 * 3. the channel was not marked unread by the user
 * @param isMessageListScrolledToBottom
 * @param messageListIsThread
 * @param wasChannelMarkedUnread
 */
export const useMarkRead = ({
  isMessageListScrolledToBottom,
  messageListIsThread,
  wasChannelMarkedUnread,
}: UseMarkReadParams) => {
  const { markRead } = useChannelActionContext('useMarkRead');
  const { channel } = useChannelStateContext('useMarkRead');

  useEffect(() => {
    const shouldMarkRead =
      !messageListIsThread &&
      isMessageListScrolledToBottom &&
      !wasChannelMarkedUnread &&
      channel.countUnread() > 0;

    const onVisibilityChange = () => {
      if (!document.hidden && shouldMarkRead) markRead();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (shouldMarkRead) markRead();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [
    channel,
    isMessageListScrolledToBottom,
    messageListIsThread,
    markRead,
    wasChannelMarkedUnread,
  ]);
};
