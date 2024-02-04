import React, { useEffect } from 'react';
import { DefaultStreamChatGenerics, useChatContext } from 'stream-chat-react';

import type { Event, Thread } from 'stream-chat';

export const useNotificationThreadMessageNew = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  threads: Array<Thread<StreamChatGenerics>>,
  setThreads: React.Dispatch<React.SetStateAction<Array<Thread<StreamChatGenerics>>>>,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useNotificationMessageNewListener');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      const message = event.message;
      if (!message?.parent_id) return threads;
      const parentInThreadsIdx = threads.findIndex((thread) => thread.id === message.parent_id);

      // If the parent message is not in threads, then don't do anything.
      // Slack doesn't append a new thread dynamically to the list, only shows a notification dot.
      // But one can use `client.getThread()` to fetch the new thread.
      if (parentInThreadsIdx === -1) {
        return;
      }

      setThreads((threads) => {
        const newThreads = [...threads];
        newThreads[parentInThreadsIdx].addReply(message);
        return newThreads;
      });
    };
    const u = client.on('notification.thread_message_new', handleEvent).unsubscribe;

    return () => {
      u();
    };
  }, [threads, setThreads]);
};
