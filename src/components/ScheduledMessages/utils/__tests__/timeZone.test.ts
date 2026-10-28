import { formatTimeZoneOffset } from '../timeZone';

describe('formatTimeZoneOffset', () => {
  const originalTimeZone = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it.each([
    ['UTC', new Date(Date.UTC(2026, 0, 15)), 'GMT'],
    ['Europe/Skopje', new Date(Date.UTC(2026, 0, 15)), 'GMT+1'],
    ['Europe/Skopje', new Date(Date.UTC(2026, 6, 15)), 'GMT+2'],
    ['Asia/Kolkata', new Date(Date.UTC(2026, 0, 15)), 'GMT+5:30'],
    ['America/New_York', new Date(Date.UTC(2026, 0, 15)), 'GMT-5'],
  ])('formats %s on %s as %s', (timeZone, date, expected) => {
    process.env.TZ = timeZone;

    expect(formatTimeZoneOffset(date)).toBe(expected);
  });
});
