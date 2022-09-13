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
  /* If true, call the `Day.js` calendar function to get the date string to display. */
  calendar?: boolean;
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Overrides the default timestamp format */
  format?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value from `MessageContext`) */
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
