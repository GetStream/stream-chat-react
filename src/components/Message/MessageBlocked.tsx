import React from 'react';
import clsx from 'clsx';

import { useUserRole } from './hooks/useUserRole';
import { useTranslationContext } from '../../context/TranslationContext';
import { useMessageContext } from '../../context';

export const MessageBlocked = () => {
  const { message } = useMessageContext();
  const { t } = useTranslationContext('MessageBlocked');

  const { isMyMessage } = useUserRole(message);

  const messageClasses = clsx(
    'str-chat__message str-chat__message-simple str-chat__message--blocked',
    message.type,
    {
      'str-chat__message--me str-chat__message-simple--me': isMyMessage,
      'str-chat__message--other': !isMyMessage,
    },
  );

  return (
    <div
      className={messageClasses}
      data-testid='message-blocked-component'
      key={message.id}
    >
      <div className='str-chat__message--blocked-inner'>
        {t('Message was blocked by moderation policies')}
      </div>
    </div>
  );
};
