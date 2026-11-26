const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MONTHS_IN_YEAR = 12;
const MIN_MONTH_PREFIX_LENGTH = 3;
const MAX_DAY_DIGITS = 2;
const YEAR_DIGITS = 4;
const TIME_TEXT_PATTERN = /^(\d{1,2})(?::(\d{2}))?$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DATE_TEXT_SEPARATOR = /[\s,./]+/;
const NUMBER_PATTERN = /^\d+$/;

const padTwoDigits = (value: number) => String(value).padStart(2, '0');

export const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`;

export const fromDateValue = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const getTimeOptions = (intervalMinutes: number) => {
  const optionCount = (HOURS_IN_DAY * MINUTES_IN_HOUR) / intervalMinutes;
  const options = Array.from({ length: optionCount }, (_, index) => {
    const minutesOfDay = index * intervalMinutes;
    return `${padTwoDigits(Math.floor(minutesOfDay / MINUTES_IN_HOUR))}:${padTwoDigits(
      minutesOfDay % MINUTES_IN_HOUR,
    )}`;
  });
  return options;
};

export const withTimeOption = (timeOptions: string[], time: string) =>
  timeOptions.includes(time) ? timeOptions : [...timeOptions, time].sort();

export const parseTimeText = (text: string) => {
  const match = TIME_TEXT_PATTERN.exec(text.trim());
  if (!match) return undefined;

  const [, hourText, minuteText = '00'] = match;
  const isValidTime =
    Number(hourText) < HOURS_IN_DAY && Number(minuteText) < MINUTES_IN_HOUR;
  if (!isValidTime) return undefined;

  const timeValue = `${hourText.padStart(2, '0')}:${minuteText}`;
  return timeValue;
};

const getMonthNames = (locale: string) => {
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthNames = Array.from({ length: MONTHS_IN_YEAR }, (_, monthIndex) =>
    monthFormat.format(new Date(2000, monthIndex, 1)).toLocaleLowerCase(locale),
  );
  return monthNames;
};

const findMonthIndex = (words: string[], monthNames: string[]) => {
  const monthIndex = words
    .filter((word) => word.length >= MIN_MONTH_PREFIX_LENGTH)
    .map((word) => monthNames.findIndex((monthName) => monthName.startsWith(word)))
    .find((index) => index >= 0);
  return monthIndex;
};

const toExistingDate = (year: number, monthIndex: number, day: number) => {
  const date = new Date(year, monthIndex, day);
  const exists = date.getMonth() === monthIndex && date.getDate() === day;
  return exists ? date : undefined;
};

const getNextAllowedDate = (monthIndex: number, day: number, earliest: Date) => {
  const startOfEarliestDay = new Date(
    earliest.getFullYear(),
    earliest.getMonth(),
    earliest.getDate(),
  );
  const dateThisYear = toExistingDate(earliest.getFullYear(), monthIndex, day);
  if (dateThisYear && dateThisYear >= startOfEarliestDay) return dateThisYear;
  return toExistingDate(earliest.getFullYear() + 1, monthIndex, day);
};

export const parseDateText = (text: string, locale: string, earliest: Date) => {
  const trimmedText = text.trim();
  const isoMatch = ISO_DATE_PATTERN.exec(trimmedText);
  if (isoMatch) {
    const [, year, month, day] = isoMatch.map(Number);
    const isoDate = toExistingDate(year, month - 1, day);
    return isoDate && toDateValue(isoDate);
  }

  const words = trimmedText
    .toLocaleLowerCase(locale)
    .split(DATE_TEXT_SEPARATOR)
    .filter(Boolean);
  const numbers = words.filter((word) => NUMBER_PATTERN.test(word));
  const dayText = numbers.find((number) => number.length <= MAX_DAY_DIGITS);
  const yearText = numbers.find((number) => number.length === YEAR_DIGITS);
  const monthIndex = findMonthIndex(words, getMonthNames(locale));
  if (monthIndex === undefined || !dayText) return undefined;

  const day = Number(dayText);
  const date = yearText
    ? toExistingDate(Number(yearText), monthIndex, day)
    : getNextAllowedDate(monthIndex, day, earliest);
  return date && toDateValue(date);
};
