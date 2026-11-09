import { useCallback, useEffect } from 'react';
import type { MessagePaginatorAggregateState, ThreadState } from 'stream-chat';
import type { ThreadListItemUIProps } from 'stream-chat-react';
import {
  AvatarStack,
  Badge,
  useChannelPreviewInfo,
  useChatContext,
  useStateStore,
  useThreadListItemContext,
  useWorkspaceNavigation,
} from 'stream-chat-react';
import './ThreadRow.css';

const latestReplySelector = ({ latestMessage }: MessagePaginatorAggregateState) => ({
  latestReply: latestMessage,
});

/**
 * One row of the thread list: the channel, the message that started the thread, its latest reply,
 * who takes part, and how many replies the user hasn't read.
 */
export const ThreadRow = ({ resetHighlighting }: ThreadListItemUIProps) => {
  const { client } = useChatContext();
  // ThreadListItem always provides the row's thread.
  const thread = useThreadListItemContext()!;
  const { isThreadActive, openThread } = useWorkspaceNavigation();

  const threadSelector = useCallback(
    (state: ThreadState) => ({
      channel: state.channel,
      parentMessage: state.parentMessage,
      participants: state.participants,
      replyCount: state.replyCount,
      unreadCount: state.read[client.userId ?? '']?.unreadMessageCount ?? 0,
    }),
    [client],
  );
  const { channel, parentMessage, participants, replyCount, unreadCount } = useStateStore(
    thread.state,
    threadSelector,
  );
  const { latestReply } = useStateStore(
    thread.messagePaginator.aggregateState,
    latestReplySelector,
  );
  const { displayTitle } = useChannelPreviewInfo({ channel });

  const participantInfo = (participants ?? []).map(({ user }) => ({
    id: user?.id,
    imageUrl: user?.image,
    userName: user?.name ?? user?.id,
  }));
  const isActive = isThreadActive(thread.id);

  // A thread that a reload just brought into the list is highlighted for two seconds.
  useEffect(() => {
    if (!resetHighlighting) return;
    const timeout = setTimeout(resetHighlighting, 2000);
    return () => clearTimeout(timeout);
  }, [resetHighlighting]);

  const className = [
    'cookbook-thread-row',
    unreadCount > 0 && 'cookbook-thread-row--unread',
    resetHighlighting && 'cookbook-thread-row--new',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // role, aria-selected and data-thread-id: what ThreadList's arrow-key navigation looks for.
    <button
      aria-selected={isActive}
      className={className}
      data-thread-id={thread.id}
      onClick={(event) =>
        openThread(thread, { additive: event.ctrlKey || event.metaKey })
      }
      role='option'
      type='button'
    >
      <span className='cookbook-thread-row__header'>
        <span className='cookbook-thread-row__channel'># {displayTitle}</span>
        {unreadCount > 0 && (
          <Badge size='sm' variant='primary'>
            {unreadCount}
          </Badge>
        )}
      </span>
      <span className='cookbook-thread-row__parent'>
        <span className='cookbook-thread-row__author'>
          {parentMessage.user?.name ?? parentMessage.user?.id}
        </span>
        {parentMessage.text}
      </span>
      {latestReply && (
        <span className='cookbook-thread-row__latest-reply'>
          <span className='cookbook-thread-row__author'>
            {latestReply.user?.name ?? latestReply.user?.id}
          </span>
          {latestReply.text}
        </span>
      )}
      <span className='cookbook-thread-row__footer'>
        <AvatarStack displayInfo={participantInfo} size='sm' />
        {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
      </span>
    </button>
  );
};
