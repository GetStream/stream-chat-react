import React, { MouseEventHandler } from 'react';

import { ReplyIcon } from './icons';

import { useChatContext } from '../../context/ChatContext';
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
  const { themeVersion } = useChatContext('MessageRepliesCountButton');

  if (!reply_count) return null;

  let replyCountText = t('replyCount', { count: reply_count });

  if (labelPlural && reply_count > 1) {
    replyCountText = `${reply_count} ${labelPlural}`;
  } else if (labelSingle) {
    replyCountText = `1 ${labelSingle}`;
  }

  return (
    <div className='str-chat__message-simple-reply-button str-chat__message-replies-count-button-wrapper'>
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        onClick={onClick}
      >
        {themeVersion === '1' && <ReplyIcon />}
        {replyCountText}
      </button>
    </div>
  );
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
