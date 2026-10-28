const padTwoDigits = (value: number) => String(value).padStart(2, '0');

/**
 * Returns the local date of `date` in the `YYYY-MM-DD` format of `<input type="date">`.
 *
 * @example
 * toDateInputValue(new Date(2026, 0, 5, 7, 4)); // '2026-01-05'
 */
export const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = padTwoDigits(date.getMonth() + 1);
  const day = padTwoDigits(date.getDate());

  const dateInputValue = `${year}-${month}-${day}`;

  return dateInputValue;
};

/**
 * Returns the local time of `date` in the `HH:mm` format of `<input type="time">`.
 *
 * @example
 * toTimeInputValue(new Date(2026, 0, 5, 7, 4)); // '07:04'
 */
export const toTimeInputValue = (date: Date) => {
  const hours = padTwoDigits(date.getHours());
  const minutes = padTwoDigits(date.getMinutes());

  const timeInputValue = `${hours}:${minutes}`;

  return timeInputValue;
};

/**
 * Returns the local date and time picked in a date input and a time input, or `undefined`
 * when either value is missing or invalid.
 *
 * @example
 * fromDateAndTimeInputValues('2026-01-05', '07:04'); // 5 January 2026, 07:04 local time
 */
export const fromDateAndTimeInputValues = (dateValue: string, timeValue: string) => {
  if (!dateValue || !timeValue) return undefined;

  const scheduledAt = new Date(`${dateValue}T${timeValue}`);

  const isValidDate = !Number.isNaN(scheduledAt.getTime());

  return isValidDate ? scheduledAt : undefined;
};
