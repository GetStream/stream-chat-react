import React from 'react';

import { isMessageBounced } from './utils';
import { useTranslationContext } from '../../context';

import type { LocalMessage } from 'stream-chat';

export interface MessageErrorTextProps {
  message: LocalMessage;
  theme: string;
}

export function MessageErrorText({ message, theme }: MessageErrorTextProps) {
  const { t } = useTranslationContext('MessageText');

  if (message.type === 'error' && !isMessageBounced(message)) {
    return (
      <div
        className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}
      >
        {t<string>('Error · Unsent')}
      </div>
    );
  }

  if (message.status === 'failed') {
    return (
      <div
        className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}
      >
        {message.error?.status !== 403
          ? t<string>('Message Failed · Click to try again')
          : t<string>('Message Failed · Unauthorized')}
      </div>
    );
  }

  return null;
}
