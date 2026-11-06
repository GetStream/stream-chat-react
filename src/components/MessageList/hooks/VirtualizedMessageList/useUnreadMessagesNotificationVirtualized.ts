import { useCallback, useEffect, useState } from 'react';
import type { RenderedMessage } from '../../utils';
import type { LocalMessage, UnreadSnapshotState } from 'stream-chat';
import { useMessagePaginator } from '../../../../hooks';
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
 * Decides when `UnreadMessagesNotification` is shown in the virtualized list, which has no unread
 * separator to scroll past. With unread messages, it shows when every rendered message was created
 * after the last read time, which approximates being scrolled past the separator.
 *
 * Also returns `unreadIsBelow`, which way the notification points: the rendered messages decide it,
 * since the loaded ones can reach past them in either direction.
 *
 * @param showAlways - Also show when every rendered message is older than the last read time.
 */
export const useUnreadMessagesNotificationVirtualized = ({
  showAlways,
}: UseUnreadMessagesNotificationParams) => {
  const [show, setShow] = useState(false);
  const [unreadIsBelow, setUnreadIsBelow] = useState<boolean | undefined>(undefined);
  const messagePaginator = useMessagePaginator();
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

      // All three are raw timestamps compared as-is; building `Date`s from them gives NaN.
      const firstRenderedMessageTime =
        (firstRenderedMessage as LocalMessage).created_at ?? 0;
      const lastRenderedMessageTime =
        (lastRenderedMessage as LocalMessage).created_at ?? 0;
      const lastReadTime = lastReadAt ?? 0;

      const scrolledBelowSeparator =
        lastReadAt != null && firstRenderedMessageTime > lastReadTime;
      const scrolledAboveSeparator =
        lastReadAt != null && lastRenderedMessageTime < lastReadTime;

      setShow(
        showAlways
          ? scrolledBelowSeparator || scrolledAboveSeparator
          : scrolledBelowSeparator,
      );
      setUnreadIsBelow(scrolledAboveSeparator);
    },
    [lastReadAt, showAlways, unreadCount],
  );

  useEffect(() => {
    if (unreadCount) return;
    setShow(false);
    setUnreadIsBelow(undefined);
  }, [unreadCount]);

  return { show, toggleShowUnreadMessagesNotification, unreadIsBelow };
};
