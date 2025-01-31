import { getDateString, predefinedFormatters } from '../utils';
import { Streami18n } from '../Streami18n';

jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
const messageCreatedAt = '1970-01-01T01:01:01.001Z';
const t = jest.fn();
const timestampTranslationKey = 'timestampTranslationKey';

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

  it.each([
    ['defined', { x: 'y' }],
    ['undefined', undefined],
  ])(
    'invokes calendar method on dayOrMoment object with calendar formats %s',
    (_, calendarFormats) => {
      const dayOrMoment = {
        calendar: jest.fn(),
        format: jest.fn(),
        isSame: true,
      };
      getDateString({
        calendar: true,
        calendarFormats,
        format: 'hh:mm A',
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: () => dayOrMoment,
      });
      expect(dayOrMoment.calendar).toHaveBeenCalledWith(undefined, calendarFormats);
      expect(dayOrMoment.format).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['defined', { x: 'y' }],
    ['undefined', undefined],
  ])(
    'invokes format method on dayOrMoment object with calendar formats %s',
    (_, calendarFormats) => {
      const dayOrMoment = {
        calendar: jest.fn(),
        format: jest.fn(),
        isSame: true,
      };
      const format = 'XY';
      getDateString({
        calendar: false,
        calendarFormats,
        format,
        formatDate: undefined,
        messageCreatedAt,
        tDateTimeParser: () => dayOrMoment,
      });
      expect(dayOrMoment.format).toHaveBeenCalledWith(format);
      expect(dayOrMoment.calendar).not.toHaveBeenCalled();
    },
  );

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
  it('gives preference to custom formatDate function before translation', () => {
    const expectedValue = 0;
    const formatDate = jest.fn();
    getDateString({
      calendar: true,
      format: 'hh:mm A',
      formatDate,
      messageCreatedAt,
      t,
      tDateTimeParser: () => expectedValue,
      timestampTranslationKey,
    });
    expect(t).not.toHaveBeenCalled();
    expect(formatDate).toHaveBeenCalledWith(new Date(messageCreatedAt));
  });
  it('does not apply translation if timestampTranslationKey key is missing', () => {
    const expectedValue = new Date().toISOString();
    const result = getDateString({
      calendar: true,
      format: 'hh:mm A',
      messageCreatedAt,
      t,
      tDateTimeParser: () => expectedValue,
    });
    expect(t).not.toHaveBeenCalled();
    expect(result).toBe(expectedValue);
  });
  it('does not apply translation if translator function is missing', () => {
    const expectedValue = new Date().toISOString();
    const result = getDateString({
      calendar: true,
      format: 'hh:mm A',
      messageCreatedAt,
      tDateTimeParser: () => expectedValue,
      timestampTranslationKey,
    });
    expect(t).not.toHaveBeenCalled();
    expect(result).toBe(expectedValue);
  });
  it.each([
    ['all enabled', { calendar: true, calendarFormats: { x: 'y' }, format: 'hh:mm A' }],
    [
      'calendar disabled',
      { calendar: false, calendarFormats: { x: 'y' }, format: 'hh:mm A' },
    ],
    [
      'calendar formats omitted',
      { calendar: true, calendarFormats: undefined, format: 'hh:mm A' },
    ],
    [
      'only format provided',
      { calendar: false, calendarFormats: undefined, format: 'hh:mm A' },
    ],
    [
      'format undefined',
      { calendar: true, calendarFormats: { x: 'y' }, format: undefined },
    ],
    [
      'calendar disabled and format undefined',
      { calendar: false, calendarFormats: { x: 'y' }, format: undefined },
    ],
    [
      'calendar formats and format undefined',
      { calendar: true, calendarFormats: undefined, format: undefined },
    ],
    [
      'calendar disabled and rest undefined',
      { calendar: false, calendarFormats: undefined, format: undefined },
    ],
    [
      'calendar undefined',
      { calendar: undefined, calendarFormats: { x: 'y' }, format: 'hh:mm A' },
    ],
    [
      'calendar and calendar formats undefined',
      { calendar: undefined, calendarFormats: undefined, format: 'hh:mm A' },
    ],
    [
      'calendar and format undefined',
      { calendar: undefined, calendarFormats: { x: 'y' }, format: undefined },
    ],
    [
      'all undefined',
      { calendar: undefined, calendarFormats: undefined, format: undefined },
    ],
  ])(
    'applies formatting via translation service with translation formatting params %s',
    (_, params) => {
      const expectedValue = 'XXXX';
      const finalParams = Object.entries(params).reduce((acc, [k, v]) => {
        if (typeof v === 'undefined') return acc;
        acc[k] = v;
        return acc;
      }, {});
      t.mockReturnValueOnce(expectedValue);
      const result = getDateString({
        ...params,
        messageCreatedAt,
        t,
        tDateTimeParser: () => new Date().toString(),
        timestampTranslationKey,
      });
      expect(t).toHaveBeenCalledWith(timestampTranslationKey, {
        ...finalParams,
        timestamp: new Date(messageCreatedAt),
      });
      expect(result).toBe(expectedValue);
    },
  );
});

describe('predefinedFormatters', () => {
  describe('timestampFormatter', () => {
    const timestampFormatter = predefinedFormatters.timestampFormatter(new Streami18n());
    const yesterdayDate = new Date(new Date().getTime() - 60 * 60 * 24 * 1000);
    const yesterdayString = yesterdayDate.toString();
    describe.each([
      ['string', yesterdayString],
      ['Date', yesterdayDate],
    ])('accepts %s', (_, yesterday) => {
      it('should format with calendar if enabled', () => {
        expect(
          timestampFormatter(yesterday, 'en', {
            calendar: true,
            calendarFormats: { sameElse: 'dddd L' },
          }).startsWith('Yesterday'),
        ).toBeTruthy();
      });
      it('should ignore calendarFormats if calendar is disabled', () => {
        expect(
          timestampFormatter(yesterday, 'en', {
            calendar: false,
            calendarFormats: { sameElse: 'dddd L' },
          }).startsWith('Yesterday'),
        ).toBeFalsy();
      });
      it('should log error parsing invalid calendarFormats', () => {
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementationOnce(() => null);
        timestampFormatter(yesterday, 'en', { calendar: true, calendarFormats: '}' });
        expect(consoleErrorSpy.mock.calls[0][0]).toBe('[TIMESTAMP FORMATTER]');
        expect(
          consoleErrorSpy.mock.calls[0][1].message.startsWith('Unexpected token'),
        ).toBeTruthy();
        consoleErrorSpy.mockRestore();
      });
      it('should parse calendarFormats', () => {
        expect(
          timestampFormatter(yesterday, 'en', {
            calendar: true,
            calendarFormats: '{ "sameElse": "dddd L" }',
          }).startsWith('Yesterday'),
        ).toBeTruthy();
      });
      it('should ignore format parameter if calendar is enabled', () => {
        expect(
          timestampFormatter(yesterday, 'en', {
            calendar: true,
            calendarFormats: { sameElse: 'dddd L' },
            format: 'YYYY',
          }).startsWith('Yesterday'),
        ).toBeTruthy();
      });
      it('should apply format parameter if calendar is disabled', () => {
        expect(
          timestampFormatter(yesterday, 'en', {
            calendar: false,
            calendarFormats: { sameElse: 'dddd L' },
            format: 'YYYY',
          }),
        ).toBe(new Date().getFullYear().toString());
      });
    });

    it('should handle null translation value', () => {
      expect(
        timestampFormatter(null, 'en', {
          calendar: false,
          calendarFormats: { sameElse: 'dddd L' },
          format: 'YYYY',
        }),
      ).toBe('null');
    });
    it('should handle undefined value', () => {
      expect(
        timestampFormatter(undefined, 'en', {
          calendar: false,
          calendarFormats: { sameElse: 'dddd L' },
          format: 'YYYY',
        }),
      ).toBeUndefined();
    });
  });
});
