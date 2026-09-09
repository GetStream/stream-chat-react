import { nsToDate, nsToMs } from 'stream-chat';

/**
 * Conversions from a wire timestamp to what the UI renders with.
 *
 * A timestamp is a unix-**nanosecond** `number` — that is what the API puts on the wire and what
 * every server-sent date field carries, `LocalMessage.created_at` included. These helpers take only
 * that (plus `null`/`undefined`, which a locally composed message legitimately has until the server
 * answers): a `Date` or an RFC3339 string reaching one of them means a conversion was missed
 * somewhere, and accepting it would silence that at one call site while the rest of the component
 * keeps reading the raw value.
 *
 * Why any conversion is needed at all: a current nanosecond value is ~1.79e18 while `Date` tops out
 * near 8.64e15, and both `new Date(ns)` and a dayjs-like parser read a bare number as
 * milliseconds. So an unconverted value is not a type error — it is an out-of-range date that
 * throws on `.toISOString()` or renders the literal string `'Invalid Date'`.
 */

/**
 * A wire timestamp as a `Date`, or `undefined` when there is none.
 *
 * A non-finite value also reads as absent rather than producing an invalid `Date`: the type says
 * `number`, but a value read from a cache, a custom API layer, or an integrator-built message can
 * still be `NaN` at runtime, and an invalid `Date` throws on `.toISOString()` in rendering.
 */
export const toDate = (timestamp?: number | null): Date | undefined =>
  timestamp == null || !Number.isFinite(timestamp) ? undefined : nsToDate(timestamp);

/**
 * A wire timestamp as epoch milliseconds, for arithmetic and comparison against `Date.now()`.
 * `undefined` when there is none.
 */
export const toMs = (timestamp?: number | null): number | undefined =>
  timestamp == null ? undefined : nsToMs(timestamp);

/**
 * A wire timestamp as an RFC3339 string, for the machine-readable `dateTime`/`title` attributes of
 * a `<time>` element and for grouping keys. `undefined` when there is none.
 */
export const toIsoString = (timestamp?: number | null): string | undefined =>
  toDate(timestamp)?.toISOString();
