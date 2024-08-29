import React from 'react';

import type { StreamMessage } from '../../context';
import { useTranslationContext } from '../../context/TranslationContext';
import { DefaultStreamChatGenerics } from '../../types/types';
import { isMessageBounced } from './utils';

export interface MessageErrorTextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> {
  message: StreamMessage<StreamChatGenerics>;
  theme: string;
}

export function MessageErrorText<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({ message, theme }: MessageErrorTextProps<StreamChatGenerics>) {
  const { t } = useTranslationContext('MessageText');

  if (message.type === 'error' && !isMessageBounced(message)) {
    return (
      <div className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}>
        {t<string>('Error · Unsent')}
      </div>
    );
  }

  if (message.status === 'failed') {
    return (
      <div className={`str-chat__${theme}-message--error-message str-chat__message--error-message`}>
        {message.errorStatusCode !== 403
          ? t<string>('Message Failed · Click to try again')
          : t<string>('Message Failed · Unauthorized')}
      </div>
    );
  }

  return null;
}
