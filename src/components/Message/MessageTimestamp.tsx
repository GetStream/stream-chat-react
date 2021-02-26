import React, { FC, useContext, useMemo } from 'react';
import {
  isDate,
  isDayjs,
  isNumberOrString,
  TDateTimeParser,
  TranslationContext,
} from '../../context';
import type { MessageTimestampProps } from 'types';

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
): string | number | Date | null {
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

const UnMemoizedMessageTimestamp: FC<MessageTimestampProps> = (props) => {
  const {
    message,
    formatDate,
    tDateTimeParser: propTDatetimeParser,
    customClass = '',
    format = defaultTimestampFormat,
    calendar = false,
  } = props;
  const { tDateTimeParser: contextTDateTimeParser } = useContext(
    TranslationContext,
  );
  const tDateTimeParser = propTDatetimeParser || contextTDateTimeParser;
  const createdAt = message?.created_at;
  const when = useMemo(
    () =>
      getDateString(createdAt, formatDate, calendar, tDateTimeParser, format),
    [formatDate, calendar, tDateTimeParser, format, createdAt],
  );

  if (!when) {
    return null;
  }

  return (
    <time className={customClass} dateTime={createdAt} title={createdAt}>
      {when}
    </time>
  );
};

export const MessageTimestamp = React.memo(UnMemoizedMessageTimestamp);
