import React from 'react';

import { useUserRole } from './hooks/useUserRole';
import { useTranslationContext } from '../../context/TranslationContext';

import type { LocalMessage } from 'stream-chat';

export type MessageDeletedProps = {
  message: LocalMessage;
};

export const MessageDeleted = (props: MessageDeletedProps) => {
  const { message } = props;

  const { t } = useTranslationContext('MessageDeleted');

  const { isMyMessage } = useUserRole(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple str-chat__message--other';

  return (
    <div
      className={`${messageClasses} str-chat__message--deleted ${message.type} `}
      data-testid={'message-deleted-component'}
      key={message.id}
    >
      <div className='str-chat__message--deleted-inner'>
        {t('This message was deleted...')}
      </div>
    </div>
  );
};
