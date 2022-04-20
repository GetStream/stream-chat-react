import {
  isDate,
  isDayOrMoment,
  isNumberOrString,
  MessageContextValue,
  TDateTimeParser,
} from '../context';

interface DateFormatterOptions {
  calendar?: boolean;
  format?: string;
  formatDate?: MessageContextValue['formatDate'];
  messageCreatedAt?: string | Date;
  tDateTimeParser?: TDateTimeParser;
}

export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';
export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

export function getDateString({
  calendar,
  format,
  formatDate,
  messageCreatedAt,
  tDateTimeParser,
}: DateFormatterOptions): string | number | null {
  if (
    !messageCreatedAt ||
    (typeof messageCreatedAt === 'string' && !Date.parse(messageCreatedAt))
  ) {
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
