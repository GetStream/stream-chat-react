import { useCallback, useEffect, useState } from 'react';
import type { StreamMessage } from '../../../../context';

export type UseUnreadMessagesNotificationParams = {
  showAlways: boolean;
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
 * @param showAlways
 * @param unreadCount
 */
export const useUnreadMessagesNotificationVirtualized = ({
  lastRead,
  showAlways,
  unreadCount,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);

  const toggleShowUnreadMessagesNotification = useCallback(
    (renderedMessages: StreamMessage[]) => {
      if (!unreadCount) return;
      const firstRenderedMessage = renderedMessages[0];
      const lastRenderedMessage = renderedMessages.slice(-1)[0];
      if (!(firstRenderedMessage && lastRenderedMessage)) return;
      const scrolledBelowSeparator =
        !!lastRead &&
        new Date(firstRenderedMessage.created_at as string | Date).getTime() >
          lastRead.getTime();
      const scrolledAboveSeparator =
        !!lastRead &&
        new Date(lastRenderedMessage.created_at as string | Date).getTime() <
          lastRead.getTime();

      setShow(
        showAlways
          ? scrolledBelowSeparator || scrolledAboveSeparator
          : scrolledBelowSeparator,
      );
    },
    [lastRead, showAlways, unreadCount],
  );

  useEffect(() => {
    if (!unreadCount) setShow(false);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification };
};
