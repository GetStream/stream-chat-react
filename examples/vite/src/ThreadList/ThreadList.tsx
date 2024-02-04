import React, { useEffect, useState } from 'react';
import { Message, MessageInput, useChatContext } from 'stream-chat-react';
import type { Channel as StreamChannel, StreamChat, Thread } from 'stream-chat';
import { DefaultStreamChatGenerics } from '../../../../dist/types/types';
import { useThreadListContext } from './ThreadListContext';
import { ThreadChannelProvider } from './ThreadChannelProvider';

export const ThreadList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { client, threadListOpen } = useChatContext<StreamChatGenerics>();
  const { loadMoreReplies, loadNextPage, threads } = useThreadListContext<StreamChatGenerics>();

  if (!threadListOpen) return null;

  return (
    <div className='str-chat__thread-list'>
      <h1>Thread List</h1>
      {threads?.map((thread) => (
        <ThreadListItem<StreamChatGenerics>
          client={client}
          key={`${thread.channel.id}-${thread.message.id}`}
          loadMoreReplies={loadMoreReplies}
          thread={thread}
        />
      ))}
      <button onClick={loadNextPage}>Load more threads</button>
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
  loadMoreReplies: (
    thread: Thread<StreamChatGenerics>,
    channel: StreamChannel<StreamChatGenerics>,
  ) => void;
  thread: Thread<StreamChatGenerics>;
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
    <ThreadChannelProvider channel={channel} key={`${channel.id}-${thread.message.id}`}>
      <ul className='str-chat__list'>
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
            onClick={() => loadMoreReplies(thread, channel)}
            style={{
              marginBottom: 10,
            }}
          >
            Show {moreReplies} more replies
          </button>
        )}

        {thread.latestReplies.map((reply) => (
          <li className='str-chat__li str-chat__li--single' key={reply.id}>
            <Message message={reply} />
          </li>
        ))}
        <MessageInput parent={thread.message} />
        <div style={{ borderBottom: '3px solid black', margin: 10 }} />
      </ul>
    </ThreadChannelProvider>
  );
};
