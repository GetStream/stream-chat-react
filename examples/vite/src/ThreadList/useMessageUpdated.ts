import React, { useEffect } from 'react';
import { DefaultStreamChatGenerics, useChatContext } from 'stream-chat-react';

import { Event, formatMessage, Thread } from 'stream-chat';

export const useMessageUpdated = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  threads: Array<Thread<StreamChatGenerics>>,
  setThreads: React.Dispatch<React.SetStateAction<Array<Thread<StreamChatGenerics>>>>,
) => {
  const { client } = useChatContext<StreamChatGenerics>('useNotificationMessageNewListener');
  const threadIds = threads.map((thread) => thread.id).join(',');

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      const message = event.message;
      if (!message) return;

      if (message.parent_id) {
        // check if one of the thread replies was deleted or updated
        const thread = threads.find((thread) => thread.message.id === message.parent_id);
        if (!thread) return;
        thread.updateReply(message);
      } else {
        // check if one of the thread parent messages was deleted or updated
        const thread = threads.find((thread) => thread.message.id === message.id);
        if (!thread) return;
        thread.message = formatMessage(message);
      }

      setThreads([...threads]);
    };

    const { unsubscribe: u1 } = client.on('message.updated', handleEvent);
    const { unsubscribe: u2 } = client.on('message.deleted', handleEvent);
    const { unsubscribe: u3 } = client.on('reaction.new', handleEvent);
    const { unsubscribe: u4 } = client.on('reaction.deleted', handleEvent);

    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [threadIds]);
};
