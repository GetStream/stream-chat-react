import type { ComponentPropsWithoutRef } from 'react';
import React, { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';

import type { MessagePaginatorAggregateState, ThreadState } from 'stream-chat';

import { Timestamp } from '../../Message/Timestamp';
import {
  Avatar,
  type AvatarProps,
  AvatarStack as DefaultAvatarStack,
} from '../../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../Avatar/utils';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useChannelPreviewInfo } from '../../ChannelListItem';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';
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
  const { onClick: onClickFromProps, ...buttonProps } = props;
  const { client, isMessageAIGenerated } = useChatContext();
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

  // Replies live in the thread's message paginator. The latest reply is tracked on the paginator's
  // `aggregateState` (advanced on every ingest), NOT derived from the pagination `state`: a reply
  // arriving via WS lands in the head interval, which is not the active window here, so the
  // pagination store would not emit. `aggregateState` is written directly on each advance, so this
  // subscription stays reactive.
  const latestReplySelector = useCallback(
    (state: MessagePaginatorAggregateState) => ({ latestReply: state.lastMessage }),
    [],
  );

  const { latestReply } = useStateStore(
    thread.messagePaginator.aggregateState,
    latestReplySelector,
  );

  const { displayTitle: channelDisplayTitle } = useChannelPreviewInfo({ channel });
  const { t, tDateTimeParser, userLanguage } =
    useTranslationContext('ThreadListItemUI');
  const { announceInteraction } = useInteractionAnnouncements();
  const { isThreadActive, openThread } = useWorkspaceNavigation();
  const {
    AvatarStack = DefaultAvatarStack,
    extractDisplayInfo = defaultExtractDisplayInfo,
  } = useComponentContext();
  const isSelected = isThreadActive(thread.id);

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
          active: isSelected,
          channel,
          client,
          displayTitle: channelDisplayTitle,
          isMessageAIGenerated,
          latestReply: latestReply ?? undefined,
          parentMessage: parentMessage ?? undefined,
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
      channel,
      channelDisplayTitle,
      client,
      isMessageAIGenerated,
      isSelected,
      latestReply,
      ownUnreadMessageCount,
      parentMessage,
      parentMessagePreview,
      parentMessageSender,
      participants,
      replyCount,
      t,
      tDateTimeParser,
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
        aria-selected={isSelected}
        className={clsx('str-chat__thread-list-item', {
          'str-chat__thread-list-item--highlighted':
            typeof resetHighlighting !== 'undefined',
        })}
        data-thread-id={thread.id}
        onClick={(event) => {
          // ⌘/ctrl-click opens the thread beside the current one; a plain click replaces it.
          void openThread(thread, { additive: event.ctrlKey || event.metaKey });
          // Confirm the opened thread to assistive tech, debounced in the registry so it lands after
          // the thread composer's focus announcement rather than competing with it. Skip when the
          // row is already the active thread (re-selecting announces nothing new).
          if (!isSelected && channelDisplayTitle) {
            announceInteraction('thread.opened', { name: channelDisplayTitle });
          }
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
