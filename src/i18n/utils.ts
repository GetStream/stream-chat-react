import Dayjs from 'dayjs';
import type { Duration as DayjsDuration } from 'dayjs/plugin/duration.js';

import type { Moment } from 'moment-timezone';
import type {
  DateFormatterOptions,
  DurationFormatterOptions,
  DynamicTranslationKey,
  PredefinedFormatters,
  StreamTFunction,
  TDateTimeParserInput,
  TDateTimeParserOutput,
  TimestampFormatterOptions,
} from './types';

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

const DEFAULT_RELATIVE_COMPACT_MAX_DAYS = 6;
const DEFAULT_RELATIVE_COMPACT_MAX_WEEKS = 3;

/**
 * Turns a date into a short, readable label: "Today", "Yesterday", "2d ago", "1w ago",
 * or a calendar date (DD/MM/YY) for older or future dates.
 *
 * What appears for each period:
 * - Same day → "Today"
 * - Yesterday → "Yesterday"
 * - 2 to maxDays days ago → "2d ago", "3d ago", … "Nd ago"
 * - If maxWeeks is greater than 0: 1 to maxWeeks weeks ago → "1w ago", "2w ago", …
 * - Anything older (or in the future) → calendar date
 *
 * To change the wording or which label is used, add these to your locale JSON (example in English):
 *
 *   "relativeTime.today": "Today",
 *   "relativeTime.yesterday": "Yesterday",
 *   "relativeTime.daysAgo": "{{ count }}d ago",
 *   "relativeTime.weeksAgo": "{{ count }}w ago",
 *
 * To use this style for a timestamp (e.g. poll votes), add for example:
 *
 *   "timestamp.PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true) }}"
 *
 * Only "Xd ago", no "Xw ago" (anything 7+ days ago shows as a date):
 *
 *   "timestamp.PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactMaxWeeks: 0) }}"
 *
 * To change how far "days ago" and "weeks ago" go: use relativeCompactMaxDays and
 * relativeCompactMaxWeeks in the formatter (e.g. relativeCompactMaxWeeks: 2 for only 1w and 2w ago).
 */
function getRelativeCompactDateString(
  messageCreatedAt: string | Date,
  t: StreamTFunction,
  tDateTimeParser: (input?: TDateTimeParserInput) => TDateTimeParserOutput,
  maxDays: number = DEFAULT_RELATIVE_COMPACT_MAX_DAYS,
  maxWeeks: number = DEFAULT_RELATIVE_COMPACT_MAX_WEEKS,
): string | null {
  const then = tDateTimeParser(messageCreatedAt);
  if (!isDayOrMoment(then)) return null;
  const now = tDateTimeParser(new Date().toISOString());
  if (!isDayOrMoment(now)) return null;
  const diffDays = (now as Dayjs.Dayjs)
    .startOf('day')
    .diff((then as Dayjs.Dayjs).startOf('day'), 'day');
  if (diffDays < 0) {
    return (then as Dayjs.Dayjs).format('DD/MM/YY');
  }
  if (diffDays === 0) return t('relativeTime.today', 'Today');
  if (diffDays === 1) return t('relativeTime.yesterday', 'Yesterday');
  if (diffDays >= 2 && diffDays <= maxDays)
    return t('relativeTime.daysAgo', {
      count: diffDays,
      defaultValue_one: '{{ count }}d ago',
      defaultValue_other: '{{ count }}d ago',
    });
  if (maxWeeks > 0) {
    const maxDaysForWeeks = maxWeeks * 7;
    if (diffDays >= 7 && diffDays <= maxDaysForWeeks) {
      const weeks = Math.ceil(diffDays / 7);
      return t('relativeTime.weeksAgo', {
        count: weeks,
        defaultValue_one: '{{ count }}w ago',
        defaultValue_other: '{{ count }}w ago',
      });
    }
  }
  return (then as Dayjs.Dayjs).format('DD/MM/YY');
}

export function getDateString({
  calendar,
  calendarFormats,
  format,
  formatDate,
  messageCreatedAt,
  relativeCompact,
  relativeCompactMaxDays,
  relativeCompactMaxWeeks,
  t,
  tDateTimeParser,
  timestampTranslationKey,
}: DateFormatterOptions): string | number | null {
  if (
    !messageCreatedAt ||
    (typeof messageCreatedAt === 'string' && !Date.parse(messageCreatedAt))
  ) {
    // TODO: replace with proper logging (@stream-io/logger)
    // console.warn(notValidDateWarning);
    return null;
  }

  if (typeof formatDate === 'function') {
    return formatDate(new Date(messageCreatedAt));
  }

  if (relativeCompact && t && tDateTimeParser) {
    const maxDays =
      typeof relativeCompactMaxDays === 'number'
        ? relativeCompactMaxDays
        : typeof relativeCompactMaxDays === 'string'
          ? parseInt(relativeCompactMaxDays, 10)
          : DEFAULT_RELATIVE_COMPACT_MAX_DAYS;
    const maxWeeks =
      typeof relativeCompactMaxWeeks === 'number'
        ? relativeCompactMaxWeeks
        : typeof relativeCompactMaxWeeks === 'string'
          ? parseInt(relativeCompactMaxWeeks, 10)
          : DEFAULT_RELATIVE_COMPACT_MAX_WEEKS;
    const result = getRelativeCompactDateString(
      messageCreatedAt,
      t,
      tDateTimeParser,
      Number.isNaN(maxDays) ? DEFAULT_RELATIVE_COMPACT_MAX_DAYS : maxDays,
      Number.isNaN(maxWeeks) ? DEFAULT_RELATIVE_COMPACT_MAX_WEEKS : maxWeeks,
    );
    if (result) return result;
  }

  if (t && timestampTranslationKey) {
    const options: TimestampFormatterOptions = {};
    if (typeof calendar !== 'undefined' && calendar !== null) options.calendar = calendar;
    if (typeof calendarFormats !== 'undefined' && calendarFormats !== null)
      options.calendarFormats = calendarFormats;
    if (typeof format !== 'undefined' && format !== null) options.format = format;

    const translatedTimestamp = t(asDynamicKey(timestampTranslationKey), {
      ...options,
      timestamp: new Date(messageCreatedAt),
    });
    const translationKeyFound = timestampTranslationKey !== translatedTimestamp;
    if (translationKeyFound) return translatedTimestamp;
  }

  if (!tDateTimeParser) {
    // TODO: replace with proper logging (@stream-io/logger)
    // console.warn(noParsingFunctionWarning);
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
      // NOTE: isDayjs is not exported in "dayjs" package for ESM, hence we access
      // `isDayjs` from Dayjs instance
      // dayjs's `.duration(value)` accepts both number and string at runtime,
      // but its TS signature post-1.11 narrowed to string only — cast through
      // unknown to keep callers passing a numeric value as before.
      const durationValue = value as unknown as string;
      if (format && Dayjs.isDayjs(streamI18n.DateTimeParser)) {
        return (
          streamI18n.DateTimeParser.duration(durationValue) as DayjsDuration
        ).format(format);
      }
      return streamI18n.DateTimeParser.duration(durationValue).humanize(!!withSuffix);
    },
  timestampFormatter:
    (streamI18n) =>
    (
      value,
      _,
      {
        calendarFormats,
        ...options
      }: Pick<
        TimestampFormatterOptions,
        | 'calendar'
        | 'format'
        | 'relativeCompact'
        | 'relativeCompactMaxDays'
        | 'relativeCompactMaxWeeks'
      > & {
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
        t: streamI18n.t,
        tDateTimeParser: streamI18n.tDateTimeParser,
      });
      if (!result || typeof result === 'number') {
        return JSON.stringify(value);
      }
      return result;
    },
};

/**
 * Used before a `Streami18n` instance has initialised, and as the `TranslationContext` default
 * outside `<Chat>`. Keys are opaque identifiers, so returning the key would render
 * "messageComposer.sendButton.label" in the UI; the inline English `defaultValue` that every
 * call site passes is rendered instead, with `{{ variable }}` placeholders interpolated.
 */
export const defaultTranslatorFunction = ((
  key: string,
  defaultValueOrOptions?: string | Record<string, unknown>,
  maybeOptions?: Record<string, unknown>,
) => {
  const defaultValue =
    typeof defaultValueOrOptions === 'string' ? defaultValueOrOptions : undefined;
  const options =
    (typeof defaultValueOrOptions === 'object' ? defaultValueOrOptions : maybeOptions) ??
    {};

  let template = defaultValue;
  if (template === undefined && typeof options.count === 'number') {
    template = (
      options.count === 1 ? options.defaultValue_one : options.defaultValue_other
    ) as string | undefined;
  }
  template ??= options.defaultValue as string | undefined;
  if (template === undefined) return key;

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, name: string) => {
    const value = options[name];
    return value === undefined || value === null ? whole : String(value);
  });
}) as unknown as StreamTFunction;

/**
 * Marks a runtime-derived string as a translation key, for the small number of keys that are not
 * known statically: `notification.message` from `stream-chat`, slash-command metadata from the
 * API, language codes, and integrator-supplied props. See {@link DynamicTranslationKey}.
 */
export const asDynamicKey = (key: string) => key as DynamicTranslationKey;

export const defaultDateTimeParser = (input?: TDateTimeParserInput) => Dayjs(input);
