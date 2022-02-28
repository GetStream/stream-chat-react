import React, { useMemo } from 'react';

import { MessageContextValue, useMessageContext } from '../../context/MessageContext';
import {
  isDate,
  isDayOrMoment,
  isNumberOrString,
  TDateTimeParser,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const defaultTimestampFormat = 'h:mmA';

export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';

export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

function getDateString(
  messageCreatedAt?: string,
  formatDate?: MessageContextValue['formatDate'],
  calendar?: boolean,
  tDateTimeParser?: TDateTimeParser,
  format?: string,
): TDateTimeParserInput | null {
  if (!messageCreatedAt || !Date.parse(messageCreatedAt)) {
    console.warn(notValidDateWarning);
    return null;
  }

  if (typeof formatDate === 'function') {
    return formatDate(new Date(messageCreatedAt));
  }

  if (!tDateTimeParser) {
    console.warn(noParsingFunctionWarning);
    return null;
  }

  const parsedTime = tDateTimeParser(messageCreatedAt);

  if (isDayOrMoment(parsedTime)) {
    /**
     * parsedTime.calendar is guaranteed on the type but is only
     * available when a user calls dayjs.extend(calendar)
     */
    return calendar && parsedTime.calendar ? parsedTime.calendar() : parsedTime.format(format);
  }

  if (isDate(parsedTime)) {
    return parsedTime.toDateString();
  }

  if (isNumberOrString(parsedTime)) {
    return parsedTime;
  }

  return null;
}

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

  const createdAt = message.created_at as string;

  const when = useMemo(
    () => getDateString(createdAt, formatDate, calendar, tDateTimeParser, format),
    [formatDate, calendar, tDateTimeParser, format, createdAt],
  );

  if (!when) return null;

  return (
    <time className={customClass} dateTime={createdAt} title={createdAt}>
      {when}
    </time>
  );
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
