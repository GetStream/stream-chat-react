import { SchedulePresetHour } from '../constants';
import type { ScheduleTimeBounds } from '../types';
import { isWithinScheduleTimeBounds } from './scheduleTimeBounds';

const DAYS_IN_WEEK = 7;
const MONDAY = 1;
const TOMORROW = 1;

export const getLocalDateAtHour = (date: Date, dayOffset: number, hour: number) => {
  const localDate = new Date(date);

  localDate.setDate(date.getDate() + dayOffset);
  localDate.setHours(hour, 0, 0, 0);

  return localDate;
};

export const getDaysUntilNextMonday = (date: Date) => {
  const daysUntilMonday = (DAYS_IN_WEEK - date.getDay() + MONDAY) % DAYS_IN_WEEK;

  const daysUntilNextMonday = daysUntilMonday || DAYS_IN_WEEK;

  return daysUntilNextMonday;
};

export const isSameLocalDay = (first: Date, second: Date) =>
  first.toDateString() === second.toDateString();

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

export const getAvailableSchedulePresets = (now: Date, bounds: ScheduleTimeBounds) => {
  const availablePresets = getSchedulePresets(now).filter((preset) =>
    isWithinScheduleTimeBounds(preset, bounds),
  );

  return availablePresets;
};
