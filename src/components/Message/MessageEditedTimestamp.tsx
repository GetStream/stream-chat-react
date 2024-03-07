import React from 'react';

import clsx from 'clsx';
import { useComponentContext, useMessageContext, useTranslationContext } from '../../context';
import { DefaultStreamChatGenerics } from '../../types';
import { MessageTimestampProps } from './MessageTimestamp';
import { Timestamp as DefaultTimestamp } from './Timestamp';

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

  if (!message.message_text_updated_at) {
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
