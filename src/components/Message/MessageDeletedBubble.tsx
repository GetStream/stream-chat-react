import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import { MessageBubble } from './MessageBubble';
import { useComponentContextIcons } from '../../context';

export type MessageDeletedProps = {
  message: LocalMessage;
};

export const MessageDeletedBubble = () => {
  const { IconNoSign } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <MessageBubble data-testid={'message-deleted-bubble'}>
      <div className='str-chat__message-text'>
        <IconNoSign />
        <span>{t('common.messageDeleted.text', 'Message deleted')}</span>
      </div>
    </MessageBubble>
  );
};
