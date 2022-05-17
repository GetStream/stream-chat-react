import { getDateString } from '../utils';

jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
const messageCreatedAt = '1970-01-01T01:01:01.001Z';

describe('getDateString', () => {
  it('returns null if not creation date provided', () => {
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: (input) => input,
        messageCreatedAt: undefined,
        tDateTimeParser: (input) => input,
      }),
    ).toBeNull();
  });
  it('returns null if creation date string is incorrectly formatted', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: (input) => input,
        messageCreatedAt: 'yesterday',
        tDateTimeParser: (input) => input,
      }),
    ).toBeNull();
  });
  it('returns null if neither datetime formatter nor custom formatting function are provided', () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: undefined,
      }),
    ).toBeNull();
  });
  it('returns a date string formatted with custom formatter function', () => {
    const expectedValue = 'expected';
    const formatDateMock = jest.fn().mockReturnValue(expectedValue);
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: formatDateMock,
        messageCreatedAt,
        tDateTimeParser: (input) => input,
      }),
    ).toBe(expectedValue);
  });
  it('returns a date string formatted as toDateString() if datetime formatter returns a Date instance', () => {
    const expectedValue = new Date(messageCreatedAt).toDateString();
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: (input) => new Date(input),
      }),
    ).toBe(expectedValue);
  });
  it('returns a date string returned by the datetime formatter', () => {
    const expectedValue = 'expected';
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: () => expectedValue,
      }),
    ).toBe(expectedValue);
  });
  it('returns a number returned by the datetime formatter', () => {
    const expectedValue = 0;
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: () => expectedValue,
      }),
    ).toBe(expectedValue);
  });
  it.each([null, undefined, {}, [], new Set(), true, new RegExp('')])(
    'returns null if datetime formatter does not return either string, number or Date instance',
    (returnedValue) => {
      expect(
        getDateString({
          calendar: true,
          format: 'hh:mm A',
          formatDate: undefined,
          messageCreatedAt,
          tDateTimeParser: () => returnedValue,
        }),
      ).toBeNull();
    },
  );
});
