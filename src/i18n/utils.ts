import Dayjs, { isDayjs } from 'dayjs';
import type { Duration as DayjsDuration } from 'dayjs/plugin/duration';

import type { TFunction } from 'i18next';
import type { Moment } from 'moment-timezone';
import type {
  DateFormatterOptions,
  DurationFormatterOptions,
  PredefinedFormatters,
  SupportedTranslations,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from './types';

export const notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';
export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

export const isNumberOrString = (
  output: TDateTimeParserOutput,
): output is number | string => typeof output === 'string' || typeof output === 'number';

export const isDayOrMoment = (
  output: TDateTimeParserOutput,
): output is Dayjs.Dayjs | Moment => !!(output as Dayjs.Dayjs | Moment)?.isSame;

export const isDate = (output: unknown): output is Date =>
  output !== null &&
  typeof output === 'object' &&
  typeof (output as Date).getTime === 'function';

export function getDateString({
  calendar,
  calendarFormats,
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
    if (typeof calendarFormats !== 'undefined' && calendarFormats !== null)
      options.calendarFormats = calendarFormats;
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
      ? parsedTime.calendar(undefined, calendarFormats || undefined)
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

export const predefinedFormatters: PredefinedFormatters = {
  durationFormatter:
    (streamI18n) =>
    (value, _, { format, withSuffix }: DurationFormatterOptions) => {
      if (format && isDayjs(streamI18n.DateTimeParser)) {
        return (streamI18n.DateTimeParser.duration(value) as DayjsDuration).format(
          format,
        );
      }
      return streamI18n.DateTimeParser.duration(value).humanize(!!withSuffix);
    },
  timestampFormatter:
    (streamI18n) =>
    (
      value,
      _,
      {
        calendarFormats,
        ...options
      }: Pick<TimestampFormatterOptions, 'calendar' | 'format'> & {
        calendarFormats?: Record<string, string> | string;
      },
    ) => {
      let parsedCalendarFormats;
      try {
        if (!options.calendar) {
          parsedCalendarFormats = {};
        } else if (typeof calendarFormats === 'string') {
          parsedCalendarFormats = JSON.parse(calendarFormats);
        } else if (typeof calendarFormats === 'object') {
          parsedCalendarFormats = calendarFormats;
        }
      } catch (e) {
        console.error('[TIMESTAMP FORMATTER]', e);
      }

      const result = getDateString({
        ...options,
        calendarFormats: parsedCalendarFormats,
        messageCreatedAt: value,
        tDateTimeParser: streamI18n.tDateTimeParser,
      });
      if (!result || typeof result === 'number') {
        return JSON.stringify(value);
      }
      return result;
    },
};

export const defaultTranslatorFunction: TFunction = <tResult = string>(key: tResult) =>
  key;

export const defaultDateTimeParser = (input?: TDateTimeParserInput) => Dayjs(input);

export const isLanguageSupported = (
  language: string,
): language is SupportedTranslations => {
  const translations = [
    'de',
    'en',
    'es',
    'fr',
    'hi',
    'it',
    'ja',
    'ko',
    'nl',
    'pt',
    'ru',
    'tr',
  ];
  return translations.some((translation) => language === translation);
};
