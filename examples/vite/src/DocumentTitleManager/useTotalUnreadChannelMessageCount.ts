import { useEffect, useState } from 'react';
import type { Event, StreamChat } from 'stream-chat';

/**
 * How many **channel messages** this user has not read, across every channel -- the server's
 * `total_unread_count`.
 *
 * Not a count of threads, and it does not appear to include thread replies: the event that
 * announces one, `notification.thread_message_new`, carries `unread_threads` but no
 * `total_unread_count`, so there is nothing for a client to update the total from. Use
 * `client.threads.state.unreadThreadCount` for threads, and do not add the two -- one counts
 * messages, the other counts threads.
 *
 * Read off the events that carry it rather than enumerating which those are: `message.new`,
 * `notification.mark_read`, `notification.mark_unread`, `notification.channel_deleted` and
 * `notification.channel_truncated` all do today, and an `in` check picks up any that join them.
 * The seed comes from the `me` payload the connection returns.
 */
// todo: there should be a state store emiting the total_unread_count value
const readTotalUnreadChannelMessageCount = (event: Event): number | undefined =>
  'total_unread_count' in event && typeof event.total_unread_count === 'number'
    ? event.total_unread_count
    : undefined;

export const useTotalUnreadChannelMessageCount = (client: StreamChat): number => {
  const [totalUnreadChannelMessageCount, setTotalUnreadChannelMessageCount] = useState(
    () => client.user?.total_unread_count ?? 0,
  );

  useEffect(() => {
    setTotalUnreadChannelMessageCount(client.user?.total_unread_count ?? 0);

    const subscription = client.on((event) => {
      const count = readTotalUnreadChannelMessageCount(event);
      if (typeof count === 'number') setTotalUnreadChannelMessageCount(count);
    });

    return () => subscription.unsubscribe();
  }, [client]);

  return totalUnreadChannelMessageCount;
};
