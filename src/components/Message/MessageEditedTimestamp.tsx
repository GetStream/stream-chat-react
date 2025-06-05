import React from 'react';

import clsx from 'clsx';
import {
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { isMessageEdited } from './utils';

import type { MessageTimestampProps } from './MessageTimestamp';

export type MessageEditedTimestampProps = MessageTimestampProps & {
  open: boolean;
};

export function MessageEditedTimestamp({
  message: propMessage,
  open,
  ...timestampProps
}: MessageEditedTimestampProps) {
  const { t } = useTranslationContext('MessageEditedTimestamp');
  const { message: contextMessage } = useMessageContext('MessageEditedTimestamp');
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
      {t('Edited')}{' '}
      <Timestamp timestamp={message.message_text_updated_at} {...timestampProps} />
    </div>
  );
}
