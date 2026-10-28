const MINUTES_IN_HOUR = 60;

/**
 * Returns the local time zone of `date` as a GMT offset label.
 *
 * Whole hours drop the minutes and UTC itself is plain `GMT`. The offset is read for the
 * given date, so a date after a daylight saving change gets the new offset.
 *
 * @example
 * formatTimeZoneOffset(date); // 'GMT+2', 'GMT-5', 'GMT+5:30' or 'GMT'
 */
export const formatTimeZoneOffset = (date: Date) => {
  const offsetMinutes = -date.getTimezoneOffset();

  if (!offsetMinutes) return 'GMT';

  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteOffsetMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteOffsetMinutes / MINUTES_IN_HOUR);
  const minutes = absoluteOffsetMinutes % MINUTES_IN_HOUR;

  const timeZoneOffset = minutes
    ? `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`
    : `GMT${sign}${hours}`;

  return timeZoneOffset;
};
