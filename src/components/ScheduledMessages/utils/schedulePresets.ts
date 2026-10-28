import { SchedulePresetHour } from '../constants';
import type { ScheduleTimeBounds } from '../types';
import { isWithinScheduleTimeBounds } from './scheduleTimeBounds';

const DAYS_IN_WEEK = 7;
const MONDAY = 1;
const TOMORROW = 1;

/**
 * Returns a copy of `date` moved by `dayOffset` days and set to `hour`:00 local time.
 *
 * Works on the local calendar, so month ends, year ends and daylight saving changes keep
 * the requested wall-clock hour.
 */
export const getLocalDateAtHour = (date: Date, dayOffset: number, hour: number) => {
  const localDate = new Date(date);

  localDate.setDate(date.getDate() + dayOffset);
  localDate.setHours(hour, 0, 0, 0);

  return localDate;
};

/**
 * Returns how many days are left until the next Monday, from 1 to 7.
 *
 * On a Monday the next Monday is a week away.
 */
export const getDaysUntilNextMonday = (date: Date) => {
  const daysUntilMonday = (DAYS_IN_WEEK - date.getDay() + MONDAY) % DAYS_IN_WEEK;

  const daysUntilNextMonday = daysUntilMonday || DAYS_IN_WEEK;

  return daysUntilNextMonday;
};

/**
 * Returns `true` when both dates fall on the same local calendar day.
 */
export const isSameLocalDay = (first: Date, second: Date) =>
  first.toDateString() === second.toDateString();

/**
 * Returns the quick schedule times of the schedule menu, in menu order.
 *
 * The presets are tomorrow at 09:00, tomorrow at 13:00 and next Monday at 09:00, all in the
 * local time zone. When tomorrow is Monday, the Monday preset is dropped because it would
 * repeat "tomorrow at 09:00".
 */
export const getSchedulePresets = (now: Date) => {
  const tomorrowMorning = getLocalDateAtHour(now, TOMORROW, SchedulePresetHour.Morning);
  const tomorrowAfternoon = getLocalDateAtHour(
    now,
    TOMORROW,
    SchedulePresetHour.Afternoon,
  );
  const nextMondayMorning = getLocalDateAtHour(
    now,
    getDaysUntilNextMonday(now),
    SchedulePresetHour.Morning,
  );

  const isTomorrowMonday = isSameLocalDay(nextMondayMorning, tomorrowMorning);

  const presets = isTomorrowMonday
    ? [tomorrowMorning, tomorrowAfternoon]
    : [tomorrowMorning, tomorrowAfternoon, nextMondayMorning];

  return presets;
};

/**
 * Returns the schedule presets that the channel's limits allow.
 *
 * A channel with a short maximum lead time can rule out "next Monday", for example.
 */
export const getAvailableSchedulePresets = (now: Date, bounds: ScheduleTimeBounds) => {
  const availablePresets = getSchedulePresets(now).filter((preset) =>
    isWithinScheduleTimeBounds(preset, bounds),
  );

  return availablePresets;
};
