import type { Streami18n } from './Streami18n';
import type Dayjs from 'dayjs';
import type { Moment } from 'moment-timezone';
import type { MessageContextValue } from '../context';
import type { TFunction } from 'i18next';

export type FormatterFactory<V> = (
  streamI18n: Streami18n,
) => (value: V, lng: string | undefined, options: Record<string, unknown>) => string;

export type TimestampFormatterOptions = {
  /* If true, call the `Day.js` calendar function to get the date string to display (e.g. "Yesterday at 3:58 PM"). */
  calendar?: boolean;
  /* Object specifying date display formats for dates formatted with calendar extension. Active only if calendar prop enabled. */
  calendarFormats?: Record<string, string>;
  /* Overrides the default timestamp format if calendar is disabled. */
  format?: string;
  /**
   * Show a short, friendly date instead of a full date and time.
   * - Today shows as "Today"
   * - Yesterday shows as "Yesterday"
   * - A few days ago (2 up to relativeCompactMaxDays) show as "2d ago", "3d ago", etc.
   * - A few weeks ago (if relativeCompactMaxWeeks is greater than 0) show as "1w ago", "2w ago", etc.
   * - Older than that (or future dates) show as a calendar date like 19/02/25
   * You can change the words used (e.g. "Hoy" instead of "Today") by adding or overriding
   * these keys in your locale JSON. Example (paste into your translation JSON):
   *
   *   "timestamp/relativeToday": "Today",
   *   "timestamp/relativeYesterday": "Yesterday",
   *   "timestamp/relativeDaysAgo": "{{ count }}d ago",
   *   "timestamp/relativeWeeksAgo": "{{ count }}w ago",
   *   "timestamp/PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true) }}"
   *
   * Only days, no weeks (7+ days show as date):
   *   "timestamp/PollVote": "{{ timestamp | timestampFormatter(relativeCompact: true; relativeCompactMaxWeeks: 0) }}"
   */
  relativeCompact?: boolean;
  /**
   * How many days in the past still show as "Xd ago" (e.g. 6 means 2d, 3d … 6d ago).
   * After that, it shows weeks (if enabled) or a calendar date.
   */
  relativeCompactMaxDays?: number;
  /**
   * How many weeks in the past show as "Xw ago" (e.g. 3 means 1w, 2w, 3w ago).
   * Set to 0 if you don’t want "Xw ago" at all: anything older than relativeCompactMaxDays
   * will show as a calendar date instead.
   */
  relativeCompactMaxWeeks?: number;
};

/**
 * import dayjs from 'dayjs';
 * import duration from 'dayjs/plugin/duration';
 *
 * dayjs.extend(duration);
 *
 * // Basic formatting
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(3661000).format('HH:mm:ss'); // "01:01:01"
 *
 * // Different format tokens
 * dayjs.duration(3661000).format('D[d] H[h] m[m] s[s]'); // "0d 1h 1m 1s"
 * dayjs.duration(3661000).format('D [days] H [hours] m [minutes] s [seconds]'); // "0 days 1 hours 1 minutes 1 seconds"
 *
 * // Zero padding
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(1000).format('H:m:s'); // "0:0:1"
 *
 * // Different units
 * dayjs.duration(3661000).format('D'); // "0"
 * dayjs.duration(3661000).format('H'); // "1"
 * dayjs.duration(3661000).format('m'); // "1"
 * dayjs.duration(3661000).format('s'); // "1"
 *
 * // Complex examples
 * dayjs.duration(3661000).format('DD:HH:mm:ss'); // "00:01:01:01"
 * dayjs.duration(3661000).format('D [days] HH:mm:ss'); // "0 days 01:01:01"
 * dayjs.duration(3661000).format('H[h] m[m] s[s]'); // "1h 1m 1s"
 *
 * // Negative durations
 * dayjs.duration(-3661000).format('HH:mm:ss'); // "-01:01:01"
 *
 * // Long durations
 * dayjs.duration(86400000).format('D [days]'); // "1 days"
 * dayjs.duration(2592000000).format('M [months]'); // "30 months"
 *
 *
 * Format tokens:
 * D - days
 * H - hours
 * m - minutes
 * s - seconds
 * S - milliseconds
 * M - months
 * Y - years
 * You can also use:
 * HH, mm, ss for zero-padded numbers
 * [text] for literal text
 */
export type DurationFormatterOptions = {
  format?: string;
  withSuffix?: boolean;
};

export type TDateTimeParserInput = string | number | Date;
export type TDateTimeParserOutput = string | number | Date | Dayjs.Dayjs | Moment;
export type TDateTimeParser = (input?: TDateTimeParserInput) => TDateTimeParserOutput;

export type SupportedTranslations =
  | 'de'
  | 'en'
  | 'es'
  | 'fr'
  | 'hi'
  | 'it'
  | 'ja'
  | 'ko'
  | 'nl'
  | 'pt'
  | 'ru'
  | 'tr';

export type DateFormatterOptions = TimestampFormatterOptions & {
  formatDate?: MessageContextValue['formatDate'];
  messageCreatedAt?: string | Date;
  t?: TFunction;
  tDateTimeParser?: TDateTimeParser;
  timestampTranslationKey?: string;
};

// Here is any used, because we do not want to enforce any specific rules and
// want to leave the type declaration to the integrator
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export type CustomFormatters = Record<string, FormatterFactory<any>>;

export type PredefinedFormatters = {
  durationFormatter: FormatterFactory<number>;
  timestampFormatter: FormatterFactory<string | Date>;
};
