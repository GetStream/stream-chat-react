import { displayDuration } from '../utils';

describe('displayDuration', () => {
  it('should return "00:00" for 0 seconds', () => {
    const expected = '00:00';
    expect(displayDuration()).toBe(expected);
    expect(displayDuration(0)).toBe(expected);
  });
  it('should return "00:00" for negative number of seconds', () => {
    const expected = '00:00';
    expect(displayDuration(-1)).toBe(expected);
  });
  it('should return time in format MM:SS if less then 60 minutes', () => {
    const expectPrependedZero = '08:01';
    expect(displayDuration(481)).toBe(expectPrependedZero);

    const expectNoPrependedZero = '59:59';
    expect(displayDuration(59 * 60 + 59)).toBe(expectNoPrependedZero);

    const sixtyMinutes = '60:00';
    expect(displayDuration(3600)).not.toBe(sixtyMinutes);
  });
  it('should return time in format HH:MM:SS if the time exceeds 60 minutes', () => {
    const sixtyMinutes = '01:00:00';
    expect(displayDuration(3600)).toBe(sixtyMinutes);

    const expectNoPrependedZero = '96:10:12';
    expect(displayDuration(96 * 3600 + 10 * 60 + 12)).toBe(expectNoPrependedZero);
  });
});
