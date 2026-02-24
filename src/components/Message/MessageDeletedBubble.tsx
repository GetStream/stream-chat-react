import React from 'react';

import { IconCircleBanSign } from '../Icons';
import { useTranslationContext } from '../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';
import { MessageBubble } from './MessageBubble';

export type MessageDeletedProps = {
  message: LocalMessage;
};

export const MessageDeletedBubble = () => {
  const { t } = useTranslationContext();

  return (
    <MessageBubble data-testid={'message-deleted-bubble'}>
      <div className='str-chat__message-text'>
        <IconCircleBanSign />
        <span>{t('Message deleted')}</span>
      </div>
    </MessageBubble>
  );
};
