import { useEffect, useState } from 'react';
import { DefaultStreamChatGenerics, useChatContext } from 'stream-chat-react';
import { useThreadListContext } from './ThreadListContext';

export const useThreadsUnreadCount = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { threads } = useThreadListContext<StreamChatGenerics>();
  const [unreadThreadCount, setUnreadThreadCount] = useState<number>(0);
  const [unreadThreadIds, setUnreadThreadIds] = useState<string[]>([]);

  useEffect(() => {
    const u1 = client.on('message.read', (e) => {
      // remove e.thread.parent_message_id from unreadThreadIds
      const isUnreadCurrently =
        unreadThreadIds.findIndex((id) => id === e.thread?.parent_message_id) > -1;
      if (isUnreadCurrently) {
        setUnreadThreadIds((ids) => ids.filter((id) => id !== e.thread?.parent_message_id));
        setUnreadThreadCount((count) => count - 1);
      }
    }).unsubscribe;

    const u2 = client.on('notification.thread_message_new', (event) => {
      const message = event.message;
      if (!message?.parent_id) return;

      if (message.user?.id === client.user?.id) {
        return;
      }

      const thread = threads.find((t) => t.id === message?.parent_id);

      if (thread) {
        return;
      }

      // check in unreadThreadIds. If it already exists, do nothing
      const isUnreadCurrently = unreadThreadIds.findIndex((id) => id === message?.parent_id) > -1;
      if (isUnreadCurrently) {
        return;
      }

      setUnreadThreadIds((ids) => (message.parent_id ? [...ids, message.parent_id] : ids));
      setUnreadThreadCount((count) => count + 1);
    }).unsubscribe;

    return () => {
      u1();
      u2();
    };
  }, [threads, unreadThreadIds, unreadThreadCount]);

  useEffect(() => {
    if (!client.user) return;

    setUnreadThreadCount(client.user?.unread_threads as number);
  }, [client.user]);

  return { unreadThreadCount };
};
