import type { MouseEventHandler } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { UserResponse } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { useChannel, useComponentContext, useMessageContext } from '../../context';
import { useStateStore } from '../../store';
import { useChatViewNavigation } from '../ChatView/ChatViewNavigationContext';
import { AvatarStack as DefaultAvatarStack } from '../Avatar';

export type MessageRepliesCountButtonProps = {
  /* If supplied, adds custom text to the end of a multiple replies message */
  labelPlural?: string;
  /* If supplied, adds custom text to the end of a single reply message */
  labelSingle?: string;
  /* Function to navigate into an existing thread on a message */
  onClick?: MouseEventHandler;
  /* The amount of replies (i.e., threaded messages) on a message */
  reply_count?: number;
  thread_participants?: UserResponse[];
};

function UnMemoizedMessageRepliesCountButton(props: MessageRepliesCountButtonProps) {
  const { AvatarStack = DefaultAvatarStack } = useComponentContext(
    MessageRepliesCountButton.name,
  );
  const {
    labelPlural,
    labelSingle,
    onClick,
    reply_count: replyCountFromProps = 0,
    thread_participants: threadParticipantsFromProps = [],
  } = props;
  const { message: contextMessage } = useMessageContext(MessageRepliesCountButton.name);
  const channel = useChannel();
  const { openThread } = useChatViewNavigation();
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

  const { t } = useTranslationContext('MessageRepliesCountButton');

  const avatarStackDisplayInfo = useMemo(
    () =>
      threadParticipants.slice(0, 3).map((participant) => ({
        imageUrl: participant.image,
        userName: participant.name || participant.id,
      })),
    [threadParticipants],
  );

  const handleClick = useCallback<MouseEventHandler>(
    (event) => {
      if (onClick) {
        onClick(event);
        return;
      }

      if (!contextMessage) return;
      void openThread({ channel, message: contextMessage });
    },
    [channel, contextMessage, onClick, openThread],
  );

  if (!replyCount) return null;

  let replyCountText = t('replyCount', { count: replyCount });

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
