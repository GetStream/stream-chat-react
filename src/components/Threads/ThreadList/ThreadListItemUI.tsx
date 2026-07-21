import type { ComponentPropsWithoutRef } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';

import type { MessagePaginatorState, ThreadState } from 'stream-chat';

import { Timestamp } from '../../Message/Timestamp';
import { Avatar, type AvatarProps, AvatarStack } from '../../Avatar';
import { useChannelPreviewInfo } from '../../ChannelListItem';
import {
  useChatContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';
import { useThreadListItemContext } from './ThreadListItem';
import { useStateStore } from '../../../store';
import { Badge } from '../../Badge';
import { SummarizedMessagePreview } from '../../SummarizedMessagePreview';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'> & {
  resetHighlighting?: () => void;
};

export const ThreadListItemUI = ({
  resetHighlighting,
  ...props
}: ThreadListItemUIProps) => {
  const { onClick: onClickFromProps, ...buttonProps } = props;
  const { client } = useChatContext();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const thread = useThreadListItemContext()!;

  const selector = useCallback(
    (nextValue: ThreadState) => ({
      channel: nextValue.channel,
      deletedAt: nextValue.deletedAt,
      ownUnreadMessageCount:
        (client.userID && nextValue.read[client.userID]?.unreadMessageCount) || 0,
      parentMessage: nextValue.parentMessage,
      participants: nextValue.participants,
      replyCount: nextValue.replyCount,
    }),
    [client],
  );

  const {
    channel,
    deletedAt,
    ownUnreadMessageCount,
    parentMessage,
    participants,
    replyCount,
  } = useStateStore(thread.state, selector);

  // Replies live in the thread's message paginator. Resolve the latest reply from the paginator's
  // tracked `latestMessageId` (index lookup), which is advanced on ingestion and therefore correct
  // regardless of the active window or the interval/item sort orientation — unlike reading the head
  // window's last entry, which assumes head == newest.
  const latestReplySelector = useCallback(
    (state: MessagePaginatorState) => ({
      latestReply: state.latestMessageId
        ? thread.messagePaginator.getItem(state.latestMessageId)
        : undefined,
    }),
    [thread],
  );

  const { latestReply } = useStateStore(
    thread.messagePaginator.state,
    latestReplySelector,
  );

  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });
  const { t } = useTranslationContext('ThreadListItemUI');
  const { isThreadActive, openThread } = useWorkspaceNavigation();
  const isSelected = isThreadActive(thread.id);

  const avatarProps: Partial<AvatarProps> | undefined = deletedAt
    ? undefined
    : ({
        imageUrl: latestReply?.user?.image,
        userName: latestReply?.user?.name || latestReply?.user?.id,
      } as const);

  const displayInfo = useMemo(() => {
    if (!participants) return [];

    return participants.slice(0, 3).map((participant) => ({
      id: participant.user?.id ?? undefined,
      imageUrl: participant.user?.image,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userName: participant.user?.name || participant.user!.id,
    }));
  }, [participants]);

  useEffect(() => {
    if (!resetHighlighting) return;

    const reset = resetHighlighting;

    const timeout = setTimeout(() => {
      reset();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [resetHighlighting]);

  return (
    <div className='str-chat__thread-list-item-container'>
      <button
        aria-selected={isSelected}
        className={clsx('str-chat__thread-list-item', {
          'str-chat__thread-list-item--highlighted':
            typeof resetHighlighting !== 'undefined',
        })}
        data-thread-id={thread.id}
        onClick={(event) => {
          // ⌘/ctrl-click opens the thread beside the current one; a plain click replaces it.
          void openThread(thread, { additive: event.ctrlKey || event.metaKey });
          onClickFromProps?.(event);
        }}
        role='option'
        {...buttonProps}
      >
        <Avatar size='xl' {...avatarProps} />
        <div className='str-chat__thread-list-item__content'>
          <div className='str-chat__thread-list-item__content-leading'>
            <span className='str-chat__thread-list-item__title'>
              {channelDisplayTitle}
            </span>
            <SummarizedMessagePreview
              latestMessage={parentMessage}
              participantCount={participants?.length}
            />
          </div>
          <div className='str-chat__thread-list-item__content-trailing'>
            <div className='str-chat__thread-list-item__reply-information'>
              <AvatarStack displayInfo={displayInfo} size='sm' />
              <span className='str-chat__thread-list-item__reply-count'>
                {t('replyCount', { count: replyCount })}
              </span>
            </div>
            <Timestamp
              customClass='str-chat__thread-list-item__timestamp'
              timestamp={latestReply?.created_at}
            />
          </div>
        </div>
        {ownUnreadMessageCount > 0 && (
          <Badge size='md' variant='primary'>
            {ownUnreadMessageCount}
          </Badge>
        )}
      </button>
    </div>
  );
};
