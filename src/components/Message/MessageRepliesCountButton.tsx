import type { MouseEventHandler } from 'react';
import type { UserResponse } from 'stream-chat';
import React, { useMemo } from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { useChannelStateContext, useComponentContext } from '../../context';
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
    reply_count: replyCount = 0,
    thread_participants: threadParticipants = [],
  } = props;
  const { channelCapabilities } = useChannelStateContext();

  const { t } = useTranslationContext('MessageRepliesCountButton');

  const avatarStackDisplayInfo = useMemo(
    () =>
      threadParticipants.slice(0, 3).map((participant) => ({
        imageUrl: participant.image,
        userName: participant.name || participant.id,
      })),
    [threadParticipants],
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
        disabled={!channelCapabilities['send-reply']}
        onClick={onClick}
      >
        {replyCountText}

        <AvatarStack displayInfo={avatarStackDisplayInfo} />
      </button>
    </div>
  );
}

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
