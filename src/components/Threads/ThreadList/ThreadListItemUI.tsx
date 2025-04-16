import React, { useCallback } from 'react';
import clsx from 'clsx';

import type { LocalMessage, ThreadState } from 'stream-chat';
import type { ComponentPropsWithoutRef } from 'react';

import { Timestamp } from '../../Message/Timestamp';
import { Avatar } from '../../Avatar';
import { Icon } from '../icons';
import { UnreadCountBadge } from '../UnreadCountBadge';

import { useChannelPreviewInfo } from '../../ChannelPreview';
import { useChatContext } from '../../../context';
import { useThreadsViewContext } from '../../ChatView';
import { useThreadListItemContext } from './ThreadListItem';
import { useStateStore } from '../../../store';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'>;

/**
 * TODO:
 * - maybe hover state? ask design
 */

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
  message?: LocalMessage;
}) => {
  const attachment = message?.attachments?.at(0);

  let attachmentIcon = '';

  if (attachment) {
    attachmentIcon +=
      attachmentTypeIconMap[
        (attachment.type as keyof typeof attachmentTypeIconMap) ?? 'file'
      ] ?? attachmentTypeIconMap.file;
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

  const selector = useCallback(
    (nextValue: ThreadState) => ({
      channel: nextValue.channel,
      deletedAt: nextValue.deletedAt,
      latestReply: nextValue.replies.at(-1),
      ownUnreadMessageCount:
        (client.userID && nextValue.read[client.userID]?.unreadMessageCount) || 0,
      parentMessage: nextValue.parentMessage,
    }),
    [client],
  );

  const { channel, deletedAt, latestReply, ownUnreadMessageCount, parentMessage } =
    useStateStore(thread.state, selector);

  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });

  const { activeThread, setActiveThread } = useThreadsViewContext();

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
          {channelDisplayTitle}
        </div>
      </div>
      <div className='str-chat__thread-list-item__parent-message'>
        <div className='str-chat__thread-list-item__parent-message-text'>
          {/* TODO: use thread.title instead? */}
          replied to: {getTitleFromMessage({ message: parentMessage })}
        </div>
        {!deletedAt && <UnreadCountBadge count={ownUnreadMessageCount} />}
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
                : getTitleFromMessage({
                    currentUserId: client.user?.id,
                    message: latestReply,
                  })}
            </div>
            <div className='str-chat__thread-list-item__latest-reply-timestamp'>
              <Timestamp timestamp={deletedAt ?? latestReply?.created_at} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
