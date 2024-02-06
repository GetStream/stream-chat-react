import { useCallback, useEffect, useState } from 'react';
import { StreamMessage } from '../../../../context';
import type { DefaultStreamChatGenerics } from '../../../../types/types';

export type UseUnreadMessagesNotificationParams = {
  unreadCount: number;
  lastRead?: Date | null;
};

/**
 * Controls the logic when an `UnreadMessagesNotification` component should be shown.
 * In virtualized message list there is no notion of being scrolled below or above `UnreadMessagesSeparator`.
 * Therefore, the `UnreadMessagesNotification` component is rendered based on timestamps.
 * If the there are unread messages in the channel and the `VirtualizedMessageList` renders
 * messages created later than the last read message in the channel, then the
 * `UnreadMessagesNotification` component is rendered. This is an approximate equivalent to being
 * scrolled below the `UnreadMessagesNotification` component.
 * @param lastRead
 * @param unreadCount
 */
export const useUnreadMessagesNotificationVirtualized = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  lastRead,
  unreadCount,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);

  const toggleShowUnreadMessagesNotification = useCallback(
    (renderedMessages: StreamMessage<StreamChatGenerics>[]) => {
      if (!renderedMessages.length) return;
      const firstRenderedMessageTimestamp = renderedMessages[0].created_at
        ? new Date(renderedMessages[0].created_at).getTime()
        : 0;
      setShow(unreadCount > 0 && !!lastRead && firstRenderedMessageTimestamp > lastRead.getTime());
    },
    [unreadCount, lastRead],
  );

  useEffect(() => {
    if (!unreadCount) setShow(false);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification };
};
