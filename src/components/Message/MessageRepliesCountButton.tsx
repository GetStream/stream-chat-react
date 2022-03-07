import React from 'react';

import { ReplyIcon } from './icons';

import { useTranslationContext } from '../../context/TranslationContext';

import type { ReactEventHandler } from './types';

export type MessageRepliesCountButtonProps = {
  labelPlural?: string;
  labelSingle?: string;
  onClick?: ReactEventHandler;
  reply_count?: number;
};

const UnMemoizedMessageRepliesCountButton: React.FC<MessageRepliesCountButtonProps> = (props) => {
  const { labelPlural, labelSingle, onClick, reply_count: count = 0 } = props;

  const { t } = useTranslationContext('MessageRepliesCountButton');

  let singleReplyText;
  let pluralReplyText;

  if (count === 1) {
    if (labelSingle) {
      singleReplyText = `1 ${labelSingle}`;
    } else {
      // singleReplyText = t('1 reply');
      singleReplyText = t('replyCount', { count });
    }
  }

  if (count && count > 1) {
    if (labelPlural) {
      pluralReplyText = `${count} ${labelPlural}`;
    } else {
      // pluralReplyText = t('{{ count }} replies', {
      //   replyCount: count,
      // });
      pluralReplyText = t('replyCount', { count });
    }
  }

  if (count && count !== 0) {
    return (
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        onClick={onClick}
      >
        <ReplyIcon />
        {count === 1 ? singleReplyText : pluralReplyText}
      </button>
    );
  }

  return null;
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
