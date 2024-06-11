import {
  isDate,
  isDayOrMoment,
  isNumberOrString,
  MessageContextValue,
  TDateTimeParser,
} from '../context';

import type { TFunction } from 'i18next';
import type { Streami18n } from './Streami18n';

export type TimestampFormatterOptions = {
  /* If true, call the `Day.js` calendar function to get the date string to display (e.g. "Yesterday at 3:58 PM"). */
  calendar?: boolean | null;
  /* Overrides the default timestamp format if calendar is disabled. */
  format?: string | null;
};

type DateFormatterOptions = TimestampFormatterOptions & {
  formatDate?: MessageContextValue['formatDate'];
  messageCreatedAt?: string | Date;
  t?: TFunction;
  tDateTimeParser?: TDateTimeParser;
  timestampTranslationKey?: string;
};

export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';
export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

export function getDateString({
  calendar,
  format,
  formatDate,
  messageCreatedAt,
  t,
  tDateTimeParser,
  timestampTranslationKey,
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

  if (t && timestampTranslationKey) {
    const options: TimestampFormatterOptions = {};
    if (typeof calendar !== 'undefined' && calendar !== null) options.calendar = calendar;
    if (typeof format !== 'undefined' && format !== null) options.format = format;

    const translatedTimestamp = t(timestampTranslationKey, {
      ...options,
      timestamp: new Date(messageCreatedAt),
    });
    const translationKeyFound = timestampTranslationKey !== translatedTimestamp;
    if (translationKeyFound) return translatedTimestamp;
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
    return calendar && parsedTime.calendar
      ? parsedTime.calendar()
      : parsedTime.format(format || undefined);
  }

  if (isDate(parsedTime)) {
    return parsedTime.toDateString();
  }

  if (isNumberOrString(parsedTime)) {
    return parsedTime;
  }

  return null;
}

export type FormatterFactory<V> = (
  streamI18n: Streami18n,
) => (value: V, lng: string | undefined, options: Record<string, unknown>) => string;

// Here is any used, because we do not want to enforce any specific rules and
// want to leave the type declaration to the integrator
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export type CustomFormatters = Record<string, FormatterFactory<any>>;

export type PredefinedFormatters = {
  timestampFormatter: FormatterFactory<string | Date>;
};

export const predefinedFormatters: PredefinedFormatters = {
  timestampFormatter: (streamI18n) => (value, _, options: TimestampFormatterOptions) => {
    const result = getDateString({
      ...options,
      messageCreatedAt: value,
      tDateTimeParser: streamI18n.tDateTimeParser,
    });
    if (!result || typeof result === 'number') {
      return JSON.stringify(value);
    }
    return result;
  },
};
