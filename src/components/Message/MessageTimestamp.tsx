import React, { useMemo } from 'react';

import {
  isDate,
  isDayjs,
  isNumberOrString,
  TDateTimeParser,
  TDateTimeParserInput,
  useTranslationContext,
} from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export const defaultTimestampFormat = 'h:mmA';

export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';

export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

function getDateString(
  messageCreatedAt?: string,
  formatDate?: MessageTimestampProps['formatDate'],
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

  if (isDayjs(parsedTime)) {
    /**
     * parsedTime.calendar is guaranteed on the type but is only
     * available when a user calls dayjs.extend(calendar)
     */
    return calendar && parsedTime.calendar
      ? parsedTime.calendar()
      : parsedTime.format(format);
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  calendar?: boolean;
  customClass?: string;
  format?: string;
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate?: (date: Date) => string;
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
};

const UnMemoizedMessageTimestamp = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageTimestampProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    calendar = false,
    customClass = '',
    format = defaultTimestampFormat,
    formatDate,
    message,
  } = props;

  const { tDateTimeParser } = useTranslationContext();

  const createdAt = message?.created_at as string;

  const when = useMemo(
    () =>
      getDateString(createdAt, formatDate, calendar, tDateTimeParser, format),
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
