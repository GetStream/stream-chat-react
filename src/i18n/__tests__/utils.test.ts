import { getDateString, predefinedFormatters } from '../utils';
import { Streami18n } from '../Streami18n';
import Dayjs from 'dayjs';
import type { TDateTimeParser } from '../types';

vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
const messageCreatedAt = '1970-01-01T01:01:01.001Z';
const t = vi.fn() as any;
const timestampTranslationKey = 'timestampTranslationKey';

const FIXED_NOW = new Date('2025-02-19T12:00:00.000Z');
const tDateTimeParserDayjs = (input) => Dayjs(input || new Date().toISOString());

describe('getDateString', () => {
  it('returns null if not creation date provided', () => {
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: (input) => input.toISOString(),
        messageCreatedAt: undefined,
        tDateTimeParser: ((input) => input) as TDateTimeParser,
      }),
    ).toBeNull();
  });

  it('returns null if creation date string is incorrectly formatted', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: (input) => input.toISOString(),
        messageCreatedAt: 'yesterday',
        tDateTimeParser: ((input) => input) as TDateTimeParser,
      }),
    ).toBeNull();
  });

  it('returns null if neither datetime formatter nor custom formatting function are provided', () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
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
    const formatDateMock = vi.fn().mockReturnValue(expectedValue);
    expect(
      getDateString({
        calendar: true,
        format: 'hh:mm A',
        formatDate: formatDateMock,
        messageCreatedAt,
        tDateTimeParser: ((input) => input) as TDateTimeParser,
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
        tDateTimeParser: (input) => new Date(input!),
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
        calendar: vi.fn(),
        format: vi.fn(),
        isSame: true,
      } as any;
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
        calendar: vi.fn(),
        format: vi.fn(),
        isSame: true,
      } as any;
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
          tDateTimeParser: (() => returnedValue) as TDateTimeParser,
        }),
      ).toBeNull();
    },
  );
  it('gives preference to custom formatDate function before translation', () => {
    const expectedValue = 0;
    const formatDate = vi.fn();
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

  describe('relativeCompact', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      vi.setSystemTime(FIXED_NOW);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns "Today" for same calendar day', () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'timestamp/relativeToday') return 'Today';
        return key;
      });
      const result = getDateString({
        messageCreatedAt: FIXED_NOW.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toBe('Today');
      expect(mockT).toHaveBeenCalledWith('timestamp/relativeToday');
    });

    it('returns "Yesterday" for 1 day ago', () => {
      const mockT = vi.fn((key: string) => {
        if (key === 'timestamp/relativeYesterday') return 'Yesterday';
        return key;
      });
      const yesterday = new Date(FIXED_NOW);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const result = getDateString({
        messageCreatedAt: yesterday.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toBe('Yesterday');
      expect(mockT).toHaveBeenCalledWith('timestamp/relativeYesterday');
    });

    it('returns "Nd ago" for 2–6 days ago', () => {
      const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
        if (key === 'timestamp/relativeDaysAgo' && opts && opts.count)
          return `${opts.count}d ago`;
        return key;
      });
      const threeDaysAgo = new Date(FIXED_NOW);
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
      const result = getDateString({
        messageCreatedAt: threeDaysAgo.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toBe('3d ago');
      expect(mockT).toHaveBeenCalledWith('timestamp/relativeDaysAgo', { count: 3 });
    });

    it('returns "Nw ago" for 1–3 weeks ago', () => {
      const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
        if (key === 'timestamp/relativeWeeksAgo' && opts && opts.count)
          return `${opts.count}w ago`;
        return key;
      });
      const sevenDaysAgo = new Date(FIXED_NOW);
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const result = getDateString({
        messageCreatedAt: sevenDaysAgo.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toBe('1w ago');
      expect(mockT).toHaveBeenCalledWith('timestamp/relativeWeeksAgo', { count: 1 });
    });

    it('returns DD/MM/YY for 4+ weeks ago', () => {
      const mockT = vi.fn((key: string) => key);
      const twentyEightDaysAgo = new Date(FIXED_NOW);
      twentyEightDaysAgo.setUTCDate(twentyEightDaysAgo.getUTCDate() - 28);
      const result = getDateString({
        messageCreatedAt: twentyEightDaysAgo.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(result).toBe('22/01/25');
    });

    it('returns DD/MM/YY for future date', () => {
      const mockT = vi.fn((key: string) => key);
      const tomorrow = new Date(FIXED_NOW);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const result = getDateString({
        messageCreatedAt: tomorrow.toISOString(),
        relativeCompact: true,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(result).toBe('20/02/25');
    });

    it('respects relativeCompactMaxWeeks: 0 (no "Nw ago", 7+ days show as date)', () => {
      const mockT = vi.fn((key: string) => key);
      const sevenDaysAgo = new Date(FIXED_NOW);
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const result = getDateString({
        messageCreatedAt: sevenDaysAgo.toISOString(),
        relativeCompact: true,
        relativeCompactMaxWeeks: 0,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(result).toBe('12/02/25');
    });

    it('respects relativeCompactMaxDays (only 2–N days show "Nd ago")', () => {
      const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
        if (key === 'timestamp/relativeDaysAgo' && opts && opts.count)
          return `${opts.count}d ago`;
        return key;
      });
      const threeDaysAgo = new Date(FIXED_NOW);
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
      const result = getDateString({
        messageCreatedAt: threeDaysAgo.toISOString(),
        relativeCompact: true,
        relativeCompactMaxDays: 2,
        relativeCompactMaxWeeks: 0,
        t: mockT as any,
        tDateTimeParser: tDateTimeParserDayjs,
      });
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      expect(result).toBe('16/02/25');
    });

    it('does not use relativeCompact when t or tDateTimeParser is missing', () => {
      const dayOrMoment = {
        calendar: vi.fn(),
        format: vi.fn().mockReturnValue('formatted'),
        isSame: true,
      } as any;
      getDateString({
        messageCreatedAt: FIXED_NOW.toISOString(),
        relativeCompact: true,
        t: undefined,
        tDateTimeParser: () => dayOrMoment,
      });
      expect(dayOrMoment.calendar).not.toHaveBeenCalled();
      expect(dayOrMoment.format).toHaveBeenCalled();
    });
  });
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
        const consoleErrorSpy = vi
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

    describe('relativeCompact', () => {
      beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(FIXED_NOW);
      });
      afterEach(() => {
        vi.useRealTimers();
      });

      it('formats with relativeCompact: true (uses t for labels; date for 4+ weeks)', () => {
        const todayIso = FIXED_NOW.toISOString();
        const yesterday = new Date(FIXED_NOW);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const threeDaysAgo = new Date(FIXED_NOW);
        threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
        const thirtyDaysAgo = new Date(FIXED_NOW);
        thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
        expect(timestampFormatter(todayIso, 'en', { relativeCompact: true })).toBe(
          'timestamp/relativeToday',
        );
        expect(
          timestampFormatter(yesterday.toISOString(), 'en', { relativeCompact: true }),
        ).toBe('timestamp/relativeYesterday');
        expect(
          timestampFormatter(threeDaysAgo.toISOString(), 'en', { relativeCompact: true }),
        ).toBe('timestamp/relativeDaysAgo');
        expect(
          timestampFormatter(thirtyDaysAgo.toISOString(), 'en', {
            relativeCompact: true,
          }),
        ).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
      });

      it('respects relativeCompactMaxWeeks: 0 when passed as number or string', () => {
        const sevenDaysAgo = new Date(FIXED_NOW);
        sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
        const result = timestampFormatter(sevenDaysAgo.toISOString(), 'en', {
          relativeCompact: true,
          relativeCompactMaxWeeks: 0,
        });
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
        expect(result).toBe('12/02/25');
        const resultStr = timestampFormatter(sevenDaysAgo.toISOString(), 'en', {
          relativeCompact: true,
          relativeCompactMaxWeeks: '0',
        });
        expect(resultStr).toBe('12/02/25');
      });
    });
  });
});
