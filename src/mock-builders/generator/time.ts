import type { TimestampNS } from 'stream-chat';
import { asTimestampNS, dateToNs, msToNs, nowNs } from 'stream-chat';

/**
 * Converts a `Date`, an ISO string or a number into the unix-nanosecond timestamp the API sends, so
 * fixtures model the wire while tests can use date literals. A bare `number` is taken to be
 * nanoseconds already. Returns the current time when called without a value.
 */
export const convertDateToTimestamp = (value?: Date | number | string): TimestampNS => {
  if (value === undefined) return nowNs();
  if (value instanceof Date) return dateToNs(value);
  if (typeof value === 'number') return asTimestampNS(value);
  return msToNs(Date.parse(value));
};
