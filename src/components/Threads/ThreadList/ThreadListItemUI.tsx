import React, { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';

import type { ThreadState } from 'stream-chat';
import type { ComponentPropsWithoutRef } from 'react';

import { Timestamp } from '../../Message/Timestamp';
import {
  Avatar,
  type AvatarProps,
  AvatarStack as DefaultAvatarStack,
} from '../../Avatar';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useChannelPreviewInfo } from '../../ChannelListItem';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../../context';
import { useThreadsViewContext } from '../../ChatView';
import { useThreadListItemContext } from './ThreadListItem';
import { useStateStore } from '../../../store';
import { Badge } from '../../Badge';
import {
  SummarizedMessagePreview,
  useLatestMessagePreview,
} from '../../SummarizedMessagePreview';
import {
  composeThreadListItemAccessibleLabel,
  type ThreadListItemLabelConfig,
} from './utils.a11y';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../Avatar/utils';

export type ThreadListItemUIProps = ComponentPropsWithoutRef<'button'> & {
  /**
   * Configures the row's composed accessible name (the `aria-label`). Override individual parts, the
   * order, the separator, or supply a full `build`. See `composeThreadListItemAccessibleLabel`.
   */
  accessibleLabelConfig?: ThreadListItemLabelConfig;
  resetHighlighting?: () => void;
};

export const ThreadListItemUI = ({
  accessibleLabelConfig,
  resetHighlighting,
  ...props
}: ThreadListItemUIProps) => {
  const { client, isMessageAIGenerated } = useChatContext();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const thread = useThreadListItemContext()!;
  const {
    AvatarStack = DefaultAvatarStack,
    extractDisplayInfo = defaultExtractDisplayInfo,
  } = useComponentContext();

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

  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });
  const { t, tDateTimeParser, userLanguage } = useTranslationContext('ThreadListItemUI');
  const { announceInteraction } = useInteractionAnnouncements();

  const { activeThread, setActiveThread } = useThreadsViewContext();

  const onSelectThread = useCallback(() => {
    if (activeThread === thread) return;
    setActiveThread(thread);
    // Confirm the opened thread to assistive tech, debounced in the registry so it lands after the
    // thread composer's focus announcement rather than competing with it.
    if (channelDisplayTitle) {
      announceInteraction('thread.opened', { name: channelDisplayTitle });
    }
  }, [activeThread, announceInteraction, channelDisplayTitle, setActiveThread, thread]);

  // Reuse the SAME preview the visible subtitle renders (text + sender, all message kinds), so the
  // announced parent message matches what is shown.
  const { senderName: parentMessageSender, text: parentMessagePreview } =
    useLatestMessagePreview({
      latestMessage: parentMessage,
      participantCount: participants?.length,
    });

  const accessibleLabel = useMemo(
    () =>
      composeThreadListItemAccessibleLabel(
        {
          active: activeThread === thread,
          channel,
          client,
          displayTitle: channelDisplayTitle,
          isMessageAIGenerated,
          latestReply,
          parentMessage,
          parentMessagePreview: parentMessage ? parentMessagePreview : undefined,
          parentMessageSender: parentMessage ? parentMessageSender : undefined,
          participantCount: participants?.length,
          replyCount,
          t,
          tDateTimeParser,
          unreadCount: ownUnreadMessageCount,
          userLanguage,
        },
        accessibleLabelConfig,
      ),
    [
      accessibleLabelConfig,
      activeThread,
      channel,
      channelDisplayTitle,
      client,
      isMessageAIGenerated,
      latestReply,
      ownUnreadMessageCount,
      parentMessage,
      parentMessagePreview,
      parentMessageSender,
      participants,
      replyCount,
      t,
      tDateTimeParser,
      thread,
      userLanguage,
    ],
  );

  const avatarProps: Partial<AvatarProps> | undefined = deletedAt
    ? undefined
    : ({
        imageUrl: latestReply?.user?.image,
        userName: latestReply?.user?.name || latestReply?.user?.id,
      } as const);

  const displayInfo = useMemo(() => {
    if (!participants) return [];

    return participants.slice(0, 3).map(extractDisplayInfo);
  }, [extractDisplayInfo, participants]);

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
        aria-label={accessibleLabel}
        aria-selected={activeThread === thread}
        className={clsx('str-chat__thread-list-item', {
          'str-chat__thread-list-item--highlighted':
            typeof resetHighlighting !== 'undefined',
        })}
        data-thread-id={thread.id}
        onClick={onSelectThread}
        role='option'
        {...props}
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
