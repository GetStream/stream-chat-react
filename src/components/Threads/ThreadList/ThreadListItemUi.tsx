import React from 'react';
import clsx from 'clsx';

import type { InferStoreValueType, Thread } from 'stream-chat';
import type { ComponentPropsWithoutRef } from 'react';

import { Avatar } from '../../Avatar';
import { Icon } from '../icons';
import { useChatContext } from '../../../context';
import { useThreadsViewContext } from '../../ChatView';
import { useThreadListItemContext } from './ThreadListItem';
import { useSimpleStateStore } from '../hooks/useSimpleStateStore';

export type ThreadListItemUiProps = ComponentPropsWithoutRef<'button'>;

// Bl - business logic
// Ui - user interface

/**
 * TODO:
 * - add selected class name "str-chat__thread-list-item--selected"
 * - maybe hover state? ask design
 * - move styling to CSS library and clean it up (separate layout and theme)
 * - figure out why some data is unavailable/adjust types accordingly
 * - use Moment/DayJs for proper created_at formatting (replace toLocaleTimeString)
 * - handle deleted message [in progress]
 * - handle markRead when loading a thread
 */

const selector = (nextValue: InferStoreValueType<Thread>) =>
  [
    nextValue.latestReplies.at(-1),
    nextValue.read,
    nextValue.parentMessage,
    nextValue.channelData,
    nextValue.deletedAt,
  ] as const;

export const attachmentTypeIconMap = {
  audio: '🔈',
  file: '📄',
  image: '📷',
  video: '🎥',
  voiceRecording: '🎙️',
} as const;

export const ThreadListItemUi = (props: ThreadListItemUiProps) => {
  const { client } = useChatContext();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const thread = useThreadListItemContext()!;
  const [latestReply, read, parentMessage, channelData, deletedAt] = useSimpleStateStore(
    thread.state,
    selector,
  );

  const { activeThread, setActiveThread } = useThreadsViewContext();

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const unreadMessagesCount = read[client.user!.id]?.unread_messages ?? 0;
  const avatarProps = deletedAt ? null : latestReply?.user;

  // const getRepliedToTitle = () => {
  //   const attachment = parentMessage?.attachments?.at(0);

  //   let attachmentIcon = '';

  //   if (attachment) {
  //     attachmentIcon +=
  //       attachmentTypeIconMap[attachment.type ?? 'file'] ?? attachmentTypeIconMap.file;
  //   }

  //   let text = ''

  //   if (attachment?.type === 'audio') {text = 'Voice message'}
  //   if (parentMessage?.text)
  // };

  return (
    <button
      className={clsx('str-chat__thread-list-item', {
        'str-chat__thread-list-item--active': activeThread === thread,
      })}
      onPointerDown={() => setActiveThread(thread)}
      {...props}
    >
      <div className='str-chat__thread-list-item__channel'>
        <Icon.MessageBubble className='str-chat__thread-list-item__channel-icon' />
        <div className='str-chat__thread-list-item__channel-text'>{channelData?.name || 'N/A'}</div>
      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          replied to: {parentMessage?.text || 'Unknown message'}
        </div>
        {unreadMessagesCount > 0 && !deletedAt && (
          <div className='str-chat__thread-list-item__parent-message-unread-count'>
            {unreadMessagesCount}
          </div>
        )}
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
                ? 'This thread has been deleted'
                : latestReply?.deleted_at
                ? 'This message has been deleted'
                : latestReply?.text || 'N/A'}
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
