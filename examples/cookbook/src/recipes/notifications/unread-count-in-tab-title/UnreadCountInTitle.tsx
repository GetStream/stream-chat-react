import { useEffect, useState } from 'react';
import type { Event } from 'stream-chat';
import { useChatContext } from 'stream-chat-react';

// The server's count of the user's unread messages across every channel. The events that change
// it carry it (`message.new`, `notification.mark_read`, `notification.mark_unread`, …), and the
// `connection.ok` event carries it again in `event.me` after every reconnect, so a count missed
// while offline is corrected.
const readTotalUnreadCount = (event: Event): number | undefined => {
  if ('total_unread_count' in event && typeof event.total_unread_count === 'number') {
    return event.total_unread_count;
  }
  return 'me' in event ? event.me?.total_unread_count : undefined;
};

const useTotalUnreadCount = () => {
  const { client } = useChatContext();
  const [totalUnreadCount, setTotalUnreadCount] = useState(
    () => client.user?.total_unread_count ?? 0,
  );

  useEffect(() => {
    // The count as of the connection, for a component that mounts after it opened.
    setTotalUnreadCount(client.user?.total_unread_count ?? 0);

    const subscription = client.on((event) => {
      const count = readTotalUnreadCount(event);
      if (count !== undefined) setTotalUnreadCount(count);
    });

    return () => subscription.unsubscribe();
  }, [client]);

  return totalUnreadCount;
};

export type UnreadCountInTitleProps = {
  /** The page title without a count, for example the app's name. */
  appTitle: string;
};

/**
 * Puts the user's unread message count in front of the page title, as "(3) My app", and shows
 * the plain title while nothing is unread. Renders nothing; place it anywhere inside Chat.
 */
export const UnreadCountInTitle = ({ appTitle }: UnreadCountInTitleProps) => {
  const totalUnreadCount = useTotalUnreadCount();

  useEffect(() => {
    document.title =
      totalUnreadCount > 0 ? `(${totalUnreadCount}) ${appTitle}` : appTitle;
  }, [appTitle, totalUnreadCount]);

  // Leaves the plain title behind when this component unmounts.
  useEffect(
    () => () => {
      document.title = appTitle;
    },
    [appTitle],
  );

  return null;
};
