import type { MouseEventHandler } from 'react';
import React, { useCallback, useContext, useMemo } from 'react';
import type { UserResponse } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import {
  MessageContext,
  useChannel,
  useComponentContext,
  useWorkspaceNavigation,
} from '../../context';
import { useStateStore } from '../../store';
import { AvatarStack as DefaultAvatarStack } from '../Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../Avatar/utils';

export type MessageRepliesCountButtonProps = {
  /** Replaces the default text after the count when there is more than one reply. */
  labelPlural?: string;
  /** Replaces the default text after the count when there is one reply. */
  labelSingle?: string;
  /** Replaces the default open-thread behavior. */
  onClick?: MouseEventHandler;
  /** Fallback when the channel's message paginator has no reply count for the message. */
  reply_count?: number;
  thread_participants?: UserResponse[];
};

function UnMemoizedMessageRepliesCountButton(props: MessageRepliesCountButtonProps) {
  const {
    AvatarStack = DefaultAvatarStack,
    extractDisplayInfo = defaultExtractDisplayInfo,
  } = useComponentContext();
  const {
    labelPlural,
    labelSingle,
    onClick,
    reply_count: replyCountFromProps = 0,
    thread_participants: threadParticipantsFromProps = [],
  } = props;
  // Also renders outside a message, from props alone.
  const { handleOpenThread, message: contextMessage } = useContext(MessageContext) ?? {};
  const channel = useChannel();
  const { openThread } = useWorkspaceNavigation();
  const replyMetadataSelector = useMemo(
    () => () => {
      const targetMessage = contextMessage?.id
        ? channel.messagePaginator.getItem(contextMessage.id)
        : undefined;

      return {
        replyCountFromPaginator: targetMessage?.reply_count,
        threadParticipantsFromPaginator: targetMessage?.thread_participants,
      };
    },
    [channel.messagePaginator, contextMessage?.id],
  );
  const { replyCountFromPaginator, threadParticipantsFromPaginator } =
    useStateStore(channel.messagePaginator.state, replyMetadataSelector) ?? {};
  const replyCount = replyCountFromPaginator ?? replyCountFromProps;
  const threadParticipants =
    threadParticipantsFromPaginator ?? threadParticipantsFromProps;

  const { t } = useTranslationContext();

  const avatarStackDisplayInfo = useMemo(
    () => threadParticipants.slice(0, 3).map((user) => extractDisplayInfo({ user })),
    [extractDisplayInfo, threadParticipants],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (event) => {
      if (onClick) {
        onClick(event);
        return;
      }

      if (!contextMessage) return;
      // The message's own handler honors a `Message.openThread` override before falling back to
      // workspace navigation.
      if (handleOpenThread) {
        handleOpenThread(event);
        return;
      }
      void openThread({ channel, message: contextMessage });
    },
    [channel, contextMessage, handleOpenThread, onClick, openThread],
  );

  if (!replyCount) return null;

  let replyCountText = t('common.replyCount.label', {
    count: replyCount,
    defaultValue_one: '1 reply',
    defaultValue_other: '{{ count }} replies',
  });

  if (labelPlural && replyCount > 1) {
    replyCountText = `${replyCount} ${labelPlural}`;
  } else if (labelSingle) {
    replyCountText = `1 ${labelSingle}`;
  }

  return (
    <div className='str-chat__message-replies-count-button-wrapper'>
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        onClick={handleClick}
      >
        {replyCountText}

        <AvatarStack displayInfo={avatarStackDisplayInfo} size='xs' />
      </button>
    </div>
  );
}

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
