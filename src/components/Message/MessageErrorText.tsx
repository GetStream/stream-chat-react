import React from 'react';

import { StreamMessage, useTranslationContext } from '../../context';

import { isMessageBounced } from './utils';

export interface MessageErrorTextProps {
  message: StreamMessage;
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
        {/* @ts-expect-error errorStatusCode might exist but isn't type-defined */}
        {message.errorStatusCode !== 403
          ? t<string>('Message Failed · Click to try again')
          : t<string>('Message Failed · Unauthorized')}
      </div>
    );
  }

  return null;
}
