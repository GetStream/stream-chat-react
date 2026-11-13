import { getScheduledMessageLimits } from 'stream-chat';
import type { Channel, ScheduledMessageLimits } from 'stream-chat';

import { CLOCK_SKEW_BUFFER_MS, ScheduleTimeError } from '../constants';
import type { ScheduleTimeBounds } from '../types';

const MS_IN_SECOND = 1000;

const NO_SCHEDULE_TIME_LIMITS: Partial<ScheduledMessageLimits> = {};

export const getScheduleTimeBounds = (
  limits: ScheduledMessageLimits | undefined,
  now: Date,
): ScheduleTimeBounds => {
  const { maxLeadTimeSeconds, minLeadTimeSeconds = 0 } =
    limits ?? NO_SCHEDULE_TIME_LIMITS;
  const nowMs = now.getTime();

  const earliest = new Date(
    nowMs + minLeadTimeSeconds * MS_IN_SECOND + CLOCK_SKEW_BUFFER_MS,
  );
  const latest =
    maxLeadTimeSeconds === undefined
      ? undefined
      : new Date(nowMs + maxLeadTimeSeconds * MS_IN_SECOND);

  const bounds = { earliest, latest };

  return bounds;
};

export const getChannelScheduleTimeBounds = (channel: Channel, now: Date) =>
  getScheduleTimeBounds(getScheduledMessageLimits(channel), now);

export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: ScheduleTimeBounds,
): ScheduleTimeError | undefined => {
  if (scheduledAt < earliest) return ScheduleTimeError.TooSoon;

  if (latest && scheduledAt > latest) return ScheduleTimeError.TooFar;

  return undefined;
};

export const isWithinScheduleTimeBounds = (
  scheduledAt: Date,
  bounds: ScheduleTimeBounds,
) => !getScheduleTimeError(scheduledAt, bounds);

export const getDefaultScheduledAt = ({ earliest }: ScheduleTimeBounds) => {
  const defaultScheduledAt = new Date(earliest);

  defaultScheduledAt.setMinutes(0, 0, 0);
  defaultScheduledAt.setHours(defaultScheduledAt.getHours() + 1);

  return defaultScheduledAt;
};
