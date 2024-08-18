import React from 'react';

import clsx from 'clsx';
import { useComponentContext } from '../../context/ComponentContext';
import { useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { isMessageEdited } from './utils';

import type { DefaultStreamChatGenerics } from '../../types';
import type { MessageTimestampProps } from './MessageTimestamp';

export type MessageEditedTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = MessageTimestampProps<StreamChatGenerics> & {
  open: boolean;
};

export function MessageEditedTimestamp<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  message: propMessage,
  open,
  ...timestampProps
}: MessageEditedTimestampProps<StreamChatGenerics>) {
  const { t } = useTranslationContext('MessageEditedTimestamp');
  const { message: contextMessage } = useMessageContext<StreamChatGenerics>(
    'MessageEditedTimestamp',
  );
  const { Timestamp = DefaultTimestamp } = useComponentContext('MessageEditedTimestamp');
  const message = propMessage || contextMessage;

  if (!isMessageEdited(message)) {
    return null;
  }

  return (
    <div
      className={clsx(
        'str-chat__message-edited-timestamp',
        open
          ? 'str-chat__message-edited-timestamp--open'
          : 'str-chat__message-edited-timestamp--collapsed',
      )}
      data-testid='message-edited-timestamp'
    >
      {t<string>('Edited')}{' '}
      <Timestamp timestamp={message.message_text_updated_at} {...timestampProps} />
    </div>
  );
}
