// @ts-check
import React, { useContext, useMemo } from 'react';
import { TranslationContext } from '../../context';

export const defaultTimestampFormat = 'h:mmA';
export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';
export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';
/**
 * @type { (
 *   messageCreatedAt?: string,
 *   formatDate?: import('types').MessageTimestampProps['formatDate'],
 *   calendar?: boolean,
 *   tDateTimeParser?: import('types').MessageTimestampProps['tDateTimeParser'],
 *   format?: string,
 * ) => string | null }
 */
function getDateString(
  messageCreatedAt,
  formatDate,
  calendar,
  tDateTimeParser,
  format,
) {
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
  if (calendar && typeof parsedTime.calendar !== 'function') {
    return null;
  }

  return calendar ? parsedTime.calendar() : parsedTime.format(format);
}
/**
 * @typedef { import('types').MessageTimestampProps } Props
 * @type { React.FC<Props> }
 */
const MessageTimestamp = (props) => {
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
  const when = useMemo(
    () =>
      getDateString(
        message?.created_at,
        formatDate,
        calendar,
        tDateTimeParser,
        format,
      ),
    [formatDate, calendar, tDateTimeParser, format, message?.created_at],
  );

  if (!when) {
    return null;
  }

  return (
    <time
      className={customClass}
      dateTime={message?.created_at}
      title={message?.created_at}
    >
      {when}
    </time>
  );
};

export default React.memo(MessageTimestamp);
