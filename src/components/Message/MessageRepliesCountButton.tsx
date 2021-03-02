import React, { useContext } from 'react';
import { TranslationContext } from '../../context';
import { ReplyIcon } from './icons';
import type { TranslationContextValue } from 'types';

export interface MessageRepliesCountButtonProps
  extends TranslationContextValue {
  labelPlural?: string;
  labelSingle?: string;
  onClick?: React.MouseEventHandler;
  reply_count?: number;
}

const UnMemoizedMessageRepliesCountButton: React.FC<MessageRepliesCountButtonProps> = ({
  labelPlural,
  labelSingle,
  onClick,
  reply_count,
}) => {
  const { t } = useContext(TranslationContext);
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

UnMemoizedMessageRepliesCountButton.defaultProps = {
  reply_count: 0,
};

export const MessageRepliesCountButton = React.memo(
  UnMemoizedMessageRepliesCountButton,
);
