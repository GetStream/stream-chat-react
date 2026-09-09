import { dateToNs, msToNs, nowNs } from 'stream-chat';

/**
 * Wire timestamps for fixtures.
 *
 * Every server-sent date field is a unix-**nanosecond** number, and the SDK does arithmetic in
 * those units — `Reminder`, for one, computes `nsToMs(remind_at - nowNs())`. A fixture built from
 * a `Date` or from epoch milliseconds is therefore wrong by a factor of 10⁶, and nothing complains:
 * it renders as 1970 or as an empty segment rather than throwing. These helpers keep the unit
 * correct without spelling out the conversion at every call site.
 *
 * Precision note: a nanosecond value exceeds `Number.MAX_SAFE_INTEGER`, so it is quantised to
 * roughly 256ns steps. Order comparisons are exact; equality against a value that round-tripped
 * through JSON is not guaranteed.
 */

/**
 * A wire timestamp for `input`, which is anything `Date` accepts — an RFC3339 string
 * (`ts('2020-01-01T10:00:00Z')`), epoch milliseconds (`ts(1000)`), or a `Date`.
 */
export const ts = (input: string | number | Date): number =>
  dateToNs(input instanceof Date ? input : new Date(input));

/**
 * A wire timestamp `offsetMs` milliseconds from `from` (now by default). Negative offsets go into
 * the past: `tsOffset(-60_000)` is a minute ago.
 */
export const tsOffset = (offsetMs: number, from: number = nowNs()): number =>
  from + msToNs(offsetMs);
