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
  const { labelPlural, labelSingle, onClick, reply_count = 0 } = props;

  const { t } = useTranslationContext('MessageRepliesCountButton');

  let singleReplyText;
  let pluralReplyText;

  if (reply_count === 1) {
    if (labelSingle) {
      singleReplyText = `1 ${labelSingle}`;
    } else {
      singleReplyText = t('1 reply');
    }
  }

  if (reply_count && reply_count > 1) {
    if (labelPlural) {
      pluralReplyText = `${reply_count} ${labelPlural}`;
    } else {
      pluralReplyText = t('{{ replyCount }} replies', {
        replyCount: reply_count,
      });
    }
  }

  if (reply_count && reply_count !== 0) {
    return (
      <button
        className='str-chat__message-replies-count-button'
        data-testid='replies-count-button'
        onClick={onClick}
      >
        <ReplyIcon />
        {reply_count === 1 ? singleReplyText : pluralReplyText}
      </button>
    );
  }

  return null;
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
) as typeof UnMemoizedMessageRepliesCountButton;
