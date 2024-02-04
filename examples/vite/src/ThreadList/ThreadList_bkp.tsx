import React, { useEffect, useState } from 'react';
import {
  Channel,
  FixedHeightMessage,
  Message,
  MessageInput,
  useChatContext,
} from 'stream-chat-react';
import type {
  ChannelFilters,
  formatMessage,
  MessageResponse,
  Channel as StreamChannel,
  StreamChat,
  Thread,
} from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../../dist/types/types';

const EmptyComponent = () => null;
export const ThreadList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { client } = useChatContext<StreamChatGenerics>();
  const [threads, setThreads] = useState<Thread<StreamChatGenerics>[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadThreads = async () => {
      const { next, threads } = await client.queryThreads();

      setThreads(threads);
      setNextCursor(next);
    };

    loadThreads();
  }, []);

  useEffect(() => {
    const { unsubscribe } = client.on(async (event) => {
      if (!event.message) return;

      if (event.type === 'notification.thread_message_new') {
        const message = event.message;
        if (!message?.parent_id) return;

        const parentInThreadsIdx = threads.findIndex((thread) => thread.id === message.parent_id);

        // If the parent message is not in threads, then we need to fetch the thread and add it to the list.
        if (parentInThreadsIdx === -1) {
          const newThread = await client.getThread(message.parent_id);
          setThreads((threads) => [newThread, ...threads]);
          return;
        }

        // TODO: get the count from event.
        // Otherwise, we need to add the reply to the thread and move the thread to the top of the list.
        const targetThread = threads.splice(parentInThreadsIdx, 1)[0];
        targetThread.addReply(message);
        setThreads((threads) => [targetThread, ...threads]);
      }

      if (event.type === 'message.deleted' || event.type === 'message.updated') {
        const message = event.message;

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
      }
    });

    return () => {
      unsubscribe();
    };
  });

  const loadMoreReplies = async (thread: Thread) => {
    await thread.getNextReplies({ limit: 5 });
    setThreads([...client.threads]);
  };

  const loadMoreThreads = async () => {
    const { threads: newThreads } = await client.queryThreads({ next: nextCursor });
    setThreads([...threads, ...newThreads]);
  };

  return (
    <div className='str-chat-thread-list'>
      {/* Header */}
      <h1>Thread List</h1>
      {threads.map((thread) => (
        <ThreadListItem
          client={client}
          key={`${thread.channel.id}-${thread.message.id}`}
          loadMoreReplies={loadMoreReplies}
          thread={thread}
        />
      ))}
      <button onClick={loadMoreThreads}>Load more threads</button>
    </div>
  );
};

const ThreadListItem = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  client,
  loadMoreReplies,
  thread,
}: {
  client: StreamChat<StreamChatGenerics>;
  loadMoreReplies: (thread: Thread) => void;
  thread: Thread;
}) => {
  const [channel, setChannel] = useState<StreamChannel<StreamChatGenerics> | undefined>(undefined);

  useEffect(() => {
    const channel = client.channel(thread.channel.type, thread.channel.id);
    setChannel(channel);
  }, []);

  const moreReplies = thread.replyCount - thread.latestReplies.length;
  if (!channel) return null;

  // We are wrapping the list item with Channel component. But I think ideally
  // we should build a context provider component explicitely for the whole list.
  return (
    <Channel
      channel={channel}
      key={`${channel.id}-${thread.message.id}`}
      MessageRepliesCountButton={EmptyComponent}
    >
      <div>
        <h3>Channel name: {thread.channel.name}</h3>
        <p>
          Participants:{' '}
          {thread.participants.map((participant) => (
            <span
              key={participant.user.id}
              style={{
                color: 'grey',
              }}
            >
              {participant.user.name}{' '}
            </span>
          ))}
        </p>
        <Message message={thread.message} />
        {/* horizontal line */}
        <div style={{ borderBottom: '0.5px solid grey', margin: 10 }} />
        {moreReplies > 0 && (
          <button
            onClick={() => loadMoreReplies(thread)}
            style={{
              marginBottom: 10,
            }}
          >
            Show {moreReplies} more replies
          </button>
        )}

        {thread.latestReplies.map((reply) => (
          <Message key={reply.id} message={reply} />
        ))}
        <MessageInput parent={thread.message} />
        <div style={{ borderBottom: '3px solid black', margin: 10 }} />
      </div>
    </Channel>
  );
};
