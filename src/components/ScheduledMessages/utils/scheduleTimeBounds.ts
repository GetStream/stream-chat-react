import { getScheduledMessageLimits } from 'stream-chat';
import type { Channel, ScheduledMessageLimits } from 'stream-chat';

import { CLOCK_SKEW_BUFFER_MS, ScheduleTimeError } from '../constants';
import type { ScheduleTimeBounds } from '../types';

const MS_IN_SECOND = 1000;

/**
 * Returns the earliest and latest time a message can be scheduled for.
 *
 * The earliest time is the minimum lead time plus a one-minute buffer that absorbs
 * clock skew between the device and the server; the latest is the maximum lead time.
 *
 * @example
 * // limits: 60 s minimum, 120 days maximum, now: 10:30:00
 * getScheduleTimeBounds(limits, now); // { earliest: 10:32:00, latest: now + 120 days }
 */
export const getScheduleTimeBounds = (
  { maxLeadTimeSeconds, minLeadTimeSeconds }: ScheduledMessageLimits,
  now: Date,
): ScheduleTimeBounds => {
  const nowMs = now.getTime();

  const earliest = new Date(
    nowMs + minLeadTimeSeconds * MS_IN_SECOND + CLOCK_SKEW_BUFFER_MS,
  );
  const latest = new Date(nowMs + maxLeadTimeSeconds * MS_IN_SECOND);

  const bounds = { earliest, latest };

  return bounds;
};

/**
 * Returns the schedule time bounds of a channel, read from its config limits.
 *
 * Channels without configured limits use the SDK defaults from `getScheduledMessageLimits`.
 */
export const getChannelScheduleTimeBounds = (channel: Channel, now: Date) =>
  getScheduleTimeBounds(getScheduledMessageLimits(channel), now);

/**
 * Returns why a time cannot be scheduled, or `undefined` when it can.
 *
 * Both bounds are inclusive.
 */
export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: ScheduleTimeBounds,
): ScheduleTimeError | undefined => {
  if (scheduledAt < earliest) return ScheduleTimeError.TooSoon;

  if (scheduledAt > latest) return ScheduleTimeError.TooFar;

  return undefined;
};

/**
 * Returns `true` when a time falls between the earliest and the latest allowed time.
 */
export const isWithinScheduleTimeBounds = (
  scheduledAt: Date,
  bounds: ScheduleTimeBounds,
) => !getScheduleTimeError(scheduledAt, bounds);

/**
 * Returns the time a custom schedule starts at: the first whole hour after the earliest
 * allowed time.
 *
 * @example
 * // earliest: 10:32
 * getDefaultScheduledAt(bounds); // 11:00
 */
export const getDefaultScheduledAt = ({ earliest }: ScheduleTimeBounds) => {
  const defaultScheduledAt = new Date(earliest);

  defaultScheduledAt.setMinutes(0, 0, 0);
  defaultScheduledAt.setHours(defaultScheduledAt.getHours() + 1);

  return defaultScheduledAt;
};
