const MINUTES_IN_HOUR = 60;

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
