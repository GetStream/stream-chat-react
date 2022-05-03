import React, { useMemo } from 'react';

import { useMessageContext } from '../../context/MessageContext';
import { isDate, useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDateString } from '../../i18n/utils';

export const defaultTimestampFormat = 'h:mmA';

export type MessageTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  calendar?: boolean;
  customClass?: string;
  format?: string;
  message?: StreamMessage<StreamChatGenerics>;
};

const UnMemoizedMessageTimestamp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageTimestampProps<StreamChatGenerics>,
) => {
  const {
    calendar = false,
    customClass = '',
    format = defaultTimestampFormat,
    message: propMessage,
  } = props;

  const { formatDate, message: contextMessage } = useMessageContext<StreamChatGenerics>(
    'MessageTimestamp',
  );
  const { tDateTimeParser } = useTranslationContext('MessageTimestamp');

  const message = propMessage || contextMessage;

  const messageCreatedAt =
    message.created_at && isDate(message.created_at)
      ? message.created_at.toISOString()
      : message.created_at;

  const when = useMemo(
    () => getDateString({ calendar, format, formatDate, messageCreatedAt, tDateTimeParser }),
    [formatDate, calendar, tDateTimeParser, format, messageCreatedAt],
  );

  if (!when) return null;

  return (
    <time className={customClass} dateTime={messageCreatedAt} title={messageCreatedAt}>
      {when}
    </time>
  );
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
