import { useCallback, useEffect, useState } from 'react';
import type { RenderedMessage } from '../../utils';
import type { LocalMessage, UnreadSnapshotState } from 'stream-chat';
import { useChannelStateContext } from '../../../../context';
import { useThreadContext } from '../../../Threads';
import { useStateStore } from '../../../../store';

export type UseUnreadMessagesNotificationParams = {
  showAlways: boolean;
  // unreadCount: number;
  // lastRead?: Date | null;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => ({
  lastReadAt: state.lastReadAt,
  unreadCount: state.unreadCount,
});

/**
 * Controls the logic when an `UnreadMessagesNotification` component should be shown.
 * In virtualized message list there is no notion of being scrolled below or above `UnreadMessagesSeparator`.
 * Therefore, the `UnreadMessagesNotification` component is rendered based on timestamps.
 * If the there are unread messages in the channel and the `VirtualizedMessageList` renders
 * messages created later than the last read message in the channel, then the
 * `UnreadMessagesNotification` component is rendered. This is an approximate equivalent to being
 * scrolled below the `UnreadMessagesNotification` component.
 * @param showAlways
 */
export const useUnreadMessagesNotificationVirtualized = ({
  showAlways,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const { messagePaginator } = thread ?? channel;
  const { lastReadAt, unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );

  const toggleShowUnreadMessagesNotification = useCallback(
    (renderedMessages: RenderedMessage[]) => {
      if (!unreadCount) return;
      const firstRenderedMessage = renderedMessages[0];
      const lastRenderedMessage = renderedMessages.slice(-1)[0];
      if (!(firstRenderedMessage && lastRenderedMessage)) return;

      const firstRenderedMessageTime = new Date(
        (firstRenderedMessage as LocalMessage).created_at ?? 0,
      ).getTime();
      const lastRenderedMessageTime = new Date(
        (lastRenderedMessage as LocalMessage).created_at ?? 0,
      ).getTime();
      const lastReadTime = new Date(lastReadAt ?? 0).getTime();

      const scrolledBelowSeparator =
        !!lastReadTime && firstRenderedMessageTime > lastReadTime;
      const scrolledAboveSeparator =
        !!lastReadTime && lastRenderedMessageTime < lastReadTime;

      setShow(
        showAlways
          ? scrolledBelowSeparator || scrolledAboveSeparator
          : scrolledBelowSeparator,
      );
    },
    [lastReadAt, showAlways, unreadCount],
  );

  useEffect(() => {
    if (!unreadCount) setShow(false);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification };
};
