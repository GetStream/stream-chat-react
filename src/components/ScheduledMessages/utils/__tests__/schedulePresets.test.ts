import {
  getAvailableSchedulePresets,
  getDaysUntilNextMonday,
  getLocalDateAtHour,
  getSchedulePresets,
  isSameLocalDay,
} from '../schedulePresets';
import { getScheduleTimeBounds } from '../scheduleTimeBounds';

const DST_TIME_ZONE = 'Europe/Skopje';

const DEFAULT_LIMITS = {
  maxLeadTimeSeconds: 120 * 24 * 60 * 60,
  maxPerChannel: 10,
  maxPerUser: 100,
  minLeadTimeSeconds: 60,
};

const toLocalParts = (date: Date) => ({
  date: date.getDate(),
  day: date.getDay(),
  hours: date.getHours(),
  minutes: date.getMinutes(),
  month: date.getMonth(),
});

describe('schedulePresets', () => {
  const originalTimeZone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = DST_TIME_ZONE;
  });

  afterAll(() => {
    process.env.TZ = originalTimeZone;
  });

  describe('getLocalDateAtHour', () => {
    it('moves the date by whole days and sets the hour', () => {
      const date = new Date(2026, 9, 28, 10, 30, 45);

      const localDate = getLocalDateAtHour(date, 2, 13);

      expect(localDate).toEqual(new Date(2026, 9, 30, 13, 0, 0, 0));
      expect(date).toEqual(new Date(2026, 9, 28, 10, 30, 45));
    });

    it('keeps the wall-clock hour across a daylight saving change', () => {
      const dayBeforeDstEnds = new Date(2026, 9, 24, 12, 0);

      const localDate = getLocalDateAtHour(dayBeforeDstEnds, 1, 9);

      expect(localDate.getHours()).toBe(9);
      expect(localDate.getTimezoneOffset()).not.toBe(
        dayBeforeDstEnds.getTimezoneOffset(),
      );
    });
  });

  describe('getDaysUntilNextMonday', () => {
    it.each([
      ['Sunday', new Date(2026, 10, 1), 1],
      ['Monday', new Date(2026, 10, 2), 7],
      ['Wednesday', new Date(2026, 10, 4), 5],
      ['Saturday', new Date(2026, 10, 7), 2],
    ])('returns the days from %s', (_, date, expected) => {
      expect(getDaysUntilNextMonday(date)).toBe(expected);
    });
  });

  describe('isSameLocalDay', () => {
    it('compares the local calendar day only', () => {
      expect(
        isSameLocalDay(new Date(2026, 0, 1, 0, 1), new Date(2026, 0, 1, 23, 59)),
      ).toBe(true);
      expect(
        isSameLocalDay(new Date(2026, 0, 1, 23, 59), new Date(2026, 0, 2, 0, 1)),
      ).toBe(false);
    });
  });

  describe('getSchedulePresets', () => {
    it('returns tomorrow at 09:00, tomorrow at 13:00 and next Monday at 09:00', () => {
      const wednesday = new Date(2026, 9, 28, 10, 30);

      const presets = getSchedulePresets(wednesday);

      expect(presets.map(toLocalParts)).toEqual([
        { date: 29, day: 4, hours: 9, minutes: 0, month: 9 },
        { date: 29, day: 4, hours: 13, minutes: 0, month: 9 },
        { date: 2, day: 1, hours: 9, minutes: 0, month: 10 },
      ]);
    });

    it('drops the Monday preset when tomorrow is Monday', () => {
      const sunday = new Date(2026, 10, 1, 18, 0);

      const presets = getSchedulePresets(sunday);

      expect(presets.map(toLocalParts)).toEqual([
        { date: 2, day: 1, hours: 9, minutes: 0, month: 10 },
        { date: 2, day: 1, hours: 13, minutes: 0, month: 10 },
      ]);
    });

    it('rolls over the end of the month and the year', () => {
      const lastDayOfYear = new Date(2026, 11, 31, 22, 0);

      const [tomorrowMorning] = getSchedulePresets(lastDayOfYear);

      expect(tomorrowMorning).toEqual(new Date(2027, 0, 1, 9, 0));
    });
  });

  describe('getAvailableSchedulePresets', () => {
    it('keeps every preset within the default limits', () => {
      const now = new Date(2026, 9, 28, 10, 30);

      const presets = getAvailableSchedulePresets(
        now,
        getScheduleTimeBounds(DEFAULT_LIMITS, now),
      );

      expect(presets).toHaveLength(3);
    });

    it('drops the presets beyond the maximum lead time', () => {
      const now = new Date(2026, 9, 28, 10, 30);
      const oneDayLimits = { ...DEFAULT_LIMITS, maxLeadTimeSeconds: 24 * 60 * 60 };

      const presets = getAvailableSchedulePresets(
        now,
        getScheduleTimeBounds(oneDayLimits, now),
      );

      expect(presets.map(toLocalParts)).toEqual([
        { date: 29, day: 4, hours: 9, minutes: 0, month: 9 },
      ]);
    });
  });
});
