import React from 'react';

import { isMessageBounced } from './utils';
import { useTranslationContext } from '../../context';

import type { LocalMessage } from 'stream-chat';

export interface MessageErrorTextProps {
  message: LocalMessage;
}

const ROOT_CLASS_NAME = 'str-chat__message--error-message';
export function MessageErrorText({ message }: MessageErrorTextProps) {
  const { t } = useTranslationContext('MessageText');

  if (message.type === 'error' && !isMessageBounced(message)) {
    return <div className={ROOT_CLASS_NAME}>{t('Error · Unsent')}</div>;
  }

  if (message.status === 'failed') {
    return (
      <div className={ROOT_CLASS_NAME}>
        {message.error?.status !== 403
          ? t('Message Failed · Click to try again')
          : t('Message Failed · Unauthorized')}
      </div>
    );
  }

  return null;
}
