import React from 'react';
import clsx from 'clsx';

import type { FormatMessageResponse, ThreadState } from 'stream-chat';
import type { ComponentPropsWithoutRef } from 'react';

import { Avatar } from '../../Avatar';
import { Icon } from '../icons';
import { UnreadCountBadge } from '../UnreadCountBadge';
import { useChatContext } from '../../../context';
import { useThreadsViewContext } from '../../ChatView';
import { useThreadListItemContext } from './ThreadListItem';
import { useStateStore } from '../hooks/useStateStore';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'>;

/**
 * TODO:
 * - maybe hover state? ask design
 * - move styling to CSS library and clean it up (separate layout and theme)
 * - use Moment/DayJs for proper created_at formatting (replace toLocaleTimeString)
 * - handle deleted message [in progress]
 */

const selector = (nextValue: ThreadState) =>
  [
    nextValue.latestReplies.at(-1),
    nextValue.read,
    nextValue.parentMessage,
    nextValue.channel,
    nextValue.deletedAt,
  ] as const;

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

// TODO: translations
const getTitleFromMessage = ({
  currentUserId,
  message,
}: {
  currentUserId?: string;
  message?: FormatMessageResponse;
}) => {
  const attachment = message?.attachments?.at(0);

  let attachmentIcon = '';

  if (attachment) {
    attachmentIcon +=
      attachmentTypeIconMap[(attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'] ??
      attachmentTypeIconMap.file;
  }

  const messageBelongsToCurrentUser = message?.user?.id === currentUserId;

  if (message?.deleted_at && message.parent_id)
    return clsx(messageBelongsToCurrentUser && 'You:', 'This reply was deleted.');

  if (message?.deleted_at && !message.parent_id)
    return clsx(messageBelongsToCurrentUser && 'You:', 'The source message was deleted.');

  if (attachment?.type === 'voiceRecording')
    return clsx(attachmentIcon, messageBelongsToCurrentUser && 'You:', 'Voice message');

  return clsx(
    attachmentIcon,
    messageBelongsToCurrentUser && 'You:',
    message?.text || attachment?.fallback || 'N/A',
  );
};

export const ThreadListItemUI = (props: ThreadListItemUIProps) => {
  const { client } = useChatContext();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const thread = useThreadListItemContext()!;
  const [latestReply, read, parentMessage, channelData, deletedAt] = useStateStore(
    thread.state,
    selector,
  );

  const { activeThread, setActiveThread } = useThreadsViewContext();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const unreadMessagesCount = read[client.user!.id]?.unread_messages ?? 0;
  const avatarProps = deletedAt ? null : latestReply?.user;

  return (
    <button
      aria-selected={activeThread === thread}
      className='str-chat__thread-list-item'
      data-thread-id={thread.id}
      onClick={() => setActiveThread(thread)}
      role='option'
      {...props}
    >
      <div className='str-chat__thread-list-item__channel'>
        <Icon.MessageBubble />
        <div className='str-chat__thread-list-item__channel-text'>
          {channelData.data?.name || 'N/A'}
        </div>
      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          {/* TODO: use thread.title instead? */}
          replied to: {getTitleFromMessage({ message: parentMessage })}
        </div>
        {!deletedAt && <UnreadCountBadge count={unreadMessagesCount} />}
      </div>
      <div className='str-chat__thread-list-item__latest-reply'>
        <Avatar {...avatarProps} />
        <div className='str-chat__thread-list-item__latest-reply-details'>
          {!deletedAt && (
            <div className='str-chat__thread-list-item__latest-reply-created-by'>
              {latestReply?.user?.name || latestReply?.user?.id || 'Unknown sender'}
            </div>
          )}
          <div className='str-chat__thread-list-item__latest-reply-text-and-timestamp'>
            <div className='str-chat__thread-list-item__latest-reply-text'>
              {deletedAt
                ? 'This thread was deleted'
                : getTitleFromMessage({ currentUserId: client.user?.id, message: latestReply })}
            </div>
            <div className='str-chat__thread-list-item__latest-reply-timestamp'>
              {deletedAt
                ? deletedAt.toLocaleTimeString()
                : latestReply?.created_at.toLocaleTimeString() || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
