import React, { MouseEventHandler } from 'react';

import { ReplyIcon } from './icons';

import { useTranslationContext } from '../../context/TranslationContext';

export type MessageRepliesCountButtonProps = {
  labelPlural?: string;
  labelSingle?: string;
  onClick?: MouseEventHandler;
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
    <button
      className='str-chat__message-replies-count-button'
      data-testid='replies-count-button'
      onClick={onClick}
    >
      <ReplyIcon />
      {replyCountText}
    </button>
  );
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
