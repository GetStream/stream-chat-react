import type { ComponentPropsWithoutRef } from 'react';
import React, { useCallback, useMemo } from 'react';

import type { ThreadState } from 'stream-chat';

import { Timestamp } from '../../Message/Timestamp';
import { Avatar, type AvatarProps, AvatarStack } from '../../Avatar';
import { useChannelPreviewInfo } from '../../ChannelPreview';
import { useChatContext, useTranslationContext } from '../../../context';
import { getChatViewEntityBinding, useChatViewNavigation } from '../../ChatView';
import { useLayoutViewState } from '../../ChatView/hooks/useLayoutViewState';
import { useThreadListItemContext } from './ThreadListItem';
import { useStateStore } from '../../../store';
import { Badge } from '../../Badge';
import {
  type ChannelPreviewMessageType,
  useLatestMessagePreview,
} from '../../ChannelPreview/hooks/useLatestMessagePreview';
import {
  IconCamera1,
  IconChainLink,
  IconCircleBanSign,
  IconExclamationCircle1,
  IconFileBend,
  IconMapPin,
  IconMicrophone,
  IconVideo,
} from '../../Icons';
import clsx from 'clsx';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'>;

const contentTypeIconMap: Partial<
  Record<ChannelPreviewMessageType, React.ComponentType>
> = {
  deleted: IconCircleBanSign,
  error: IconExclamationCircle1,
  file: IconFileBend,
  image: IconCamera1,
  link: IconChainLink,
  location: IconMapPin,
  video: IconVideo,
  voice: IconMicrophone,
};

export const ThreadListItemUI = (props: ThreadListItemUIProps) => {
  const { onClick: onClickFromProps, ...buttonProps } = props;
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
      participants: nextValue.participants,
      replyCount: nextValue.replyCount,
    }),
    [client],
  );

  const {
    channel,
    deletedAt,
    latestReply,
    ownUnreadMessageCount,
    parentMessage,
    participants,
    replyCount,
  } = useStateStore(thread.state, selector);

  const { senderName, text, type } = useLatestMessagePreview({
    latestMessage: parentMessage,
    participantCount: participants?.length,
  });

  const ContentTypeIcon = contentTypeIconMap[type];

  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });
  const { t } = useTranslationContext('ThreadListItemUI');
  const { openThread } = useChatViewNavigation();
  const { availableSlots, slotBindings } = useLayoutViewState();
  const isSelected = availableSlots.some((slot) => {
    const binding = getChatViewEntityBinding(slotBindings[slot]);
    return binding?.kind === 'thread' && binding.source.id === thread.id;
  });

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

  return (
    <div className='str-chat__thread-list-item-container'>
      <button
        aria-pressed={isSelected}
        className='str-chat__thread-list-item'
        data-thread-id={thread.id}
        onClick={(event) => {
          const slot = event.ctrlKey || event.metaKey ? 'optional-thread' : 'main-thread';
          void openThread(thread, { slot });
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
            <div
              className={clsx('str-chat__thread-list-item__message-preview', {
                [`str-chat__thread-list-item__message-preview--${type}`]: type,
              })}
            >
              {type !== 'error' && !!senderName && (
                <span className='str-chat__thread-list-item__message-preview-sender'>
                  {senderName}:
                </span>
              )}
              {ContentTypeIcon && <ContentTypeIcon />}
              <span className='str-chat__thread-list-item__message-preview-text'>
                {text}
              </span>
            </div>
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
