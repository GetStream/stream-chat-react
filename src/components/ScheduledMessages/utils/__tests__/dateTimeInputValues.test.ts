import {
  fromDateAndTimeInputValues,
  toDateInputValue,
  toTimeInputValue,
} from '../dateTimeInputValues';

describe('dateTimeInputValues', () => {
  it('formats the local date for a date input', () => {
    expect(toDateInputValue(new Date(2026, 0, 5, 7, 4))).toBe('2026-01-05');
  });

  it('formats the local time for a time input', () => {
    expect(toTimeInputValue(new Date(2026, 0, 5, 7, 4))).toBe('07:04');
  });

  it('parses the input values as local time', () => {
    expect(fromDateAndTimeInputValues('2026-01-05', '07:04')).toEqual(
      new Date(2026, 0, 5, 7, 4),
    );
  });

  it('round-trips a local date and time', () => {
    const date = new Date(2026, 11, 31, 23, 59);

    expect(
      fromDateAndTimeInputValues(toDateInputValue(date), toTimeInputValue(date)),
    ).toEqual(date);
  });

  it.each([
    ['a missing date', '', '07:04'],
    ['a missing time', '2026-01-05', ''],
    ['an invalid date', 'not-a-date', '07:04'],
  ])('returns undefined for %s', (_, dateValue, timeValue) => {
    expect(fromDateAndTimeInputValues(dateValue, timeValue)).toBeUndefined();
  });
});
