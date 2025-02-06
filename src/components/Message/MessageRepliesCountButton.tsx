import type { MouseEventHandler } from 'react';
import React from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

export type MessageRepliesCountButtonProps = {
  /* If supplied, adds custom text to the end of a multiple replies message */
  labelPlural?: string;
  /* If supplied, adds custom text to the end of a single reply message */
  labelSingle?: string;
  /* Function to navigate into an existing thread on a message */
  onClick?: MouseEventHandler;
  /* The amount of replies (i.e., threaded messages) on a message */
  reply_count?: number;
};

const UnMemoizedMessageRepliesCountButton = (props: MessageRepliesCountButtonProps) => {
  const { labelPlural, labelSingle, onClick, reply_count = 0 } = props;

  const { t } = useTranslationContext('MessageRepliesCountButton');

  if (!reply_count) return null;

  let replyCountText = t('replyCount', { count: reply_count });

  if (labelPlural && reply_count > 1) {
    replyCountText = `${reply_count} ${labelPlural}`;
  } else if (labelSingle) {
    replyCountText = `1 ${labelSingle}`;
  }

  return (
    <div className='str-chat__message-replies-count-button-wrapper'>
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        onClick={onClick}
      >
        {replyCountText}
      </button>
    </div>
  );
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
