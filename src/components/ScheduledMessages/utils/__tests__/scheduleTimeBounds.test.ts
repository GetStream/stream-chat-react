import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel } from 'stream-chat';

import { ScheduleTimeError } from '../../constants';
import {
  getChannelScheduleTimeBounds,
  getDefaultScheduledAt,
  getScheduleTimeBounds,
  getScheduleTimeError,
  isWithinScheduleTimeBounds,
} from '../scheduleTimeBounds';

const MINUTE_MS = 60 * 1000;

const DEFAULT_LIMITS = {
  maxLeadTimeSeconds: 120 * 24 * 60 * 60,
  maxPerChannel: 10,
  maxPerUser: 100,
  minLeadTimeSeconds: 60,
};

const now = new Date(2026, 9, 28, 10, 30, 15);

describe('getScheduleTimeBounds', () => {
  it('adds a one-minute buffer to the minimum lead time', () => {
    const { earliest, latest } = getScheduleTimeBounds(DEFAULT_LIMITS, now);

    expect(earliest.getTime() - now.getTime()).toBe(2 * MINUTE_MS);
    expect(latest.getTime() - now.getTime()).toBe(
      DEFAULT_LIMITS.maxLeadTimeSeconds * 1000,
    );
  });
});

describe('getChannelScheduleTimeBounds', () => {
  it('reads the limits from the channel config', () => {
    const channel = fromPartial<Channel>({
      getConfig: () =>
        fromPartial({
          scheduled_messages_max_lead_time_seconds: 3600,
          scheduled_messages_min_lead_time_seconds: 300,
        }),
    });

    const { earliest, latest } = getChannelScheduleTimeBounds(channel, now);

    expect(earliest.getTime() - now.getTime()).toBe(6 * MINUTE_MS);
    expect(latest.getTime() - now.getTime()).toBe(60 * MINUTE_MS);
  });

  it('falls back to the default limits', () => {
    const channel = fromPartial<Channel>({ getConfig: () => undefined });

    expect(getChannelScheduleTimeBounds(channel, now)).toEqual(
      getScheduleTimeBounds(DEFAULT_LIMITS, now),
    );
  });
});

describe('getScheduleTimeError', () => {
  const bounds = getScheduleTimeBounds(DEFAULT_LIMITS, now);

  it('accepts both bounds', () => {
    expect(getScheduleTimeError(bounds.earliest, bounds)).toBeUndefined();
    expect(getScheduleTimeError(bounds.latest, bounds)).toBeUndefined();
    expect(isWithinScheduleTimeBounds(bounds.earliest, bounds)).toBe(true);
  });

  it('rejects a time before the earliest time', () => {
    const tooSoon = new Date(bounds.earliest.getTime() - 1);

    expect(getScheduleTimeError(tooSoon, bounds)).toBe(ScheduleTimeError.TooSoon);
    expect(isWithinScheduleTimeBounds(tooSoon, bounds)).toBe(false);
  });

  it('rejects a time after the latest time', () => {
    const tooFar = new Date(bounds.latest.getTime() + 1);

    expect(getScheduleTimeError(tooFar, bounds)).toBe(ScheduleTimeError.TooFar);
  });
});

describe('getDefaultScheduledAt', () => {
  it('returns the first whole hour after the earliest time', () => {
    const bounds = getScheduleTimeBounds(DEFAULT_LIMITS, now);

    const defaultScheduledAt = getDefaultScheduledAt(bounds);

    expect(defaultScheduledAt).toEqual(new Date(2026, 9, 28, 11, 0, 0, 0));
    expect(isWithinScheduleTimeBounds(defaultScheduledAt, bounds)).toBe(true);
  });
});
