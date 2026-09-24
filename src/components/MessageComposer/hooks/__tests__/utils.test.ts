import { prettifyFileSize } from '../utils';

describe('prettifyFileSize', () => {
  it.each([
    [0, '0.00 B'],
    [1, '1.00 B'],
    [669, '669 B'],
    [1024, '1.00 kB'],
    [1337, '1.31 kB'],
    [1536, '1.50 kB'],
    [500_000, '488 kB'],
    [1024 * 1024, '1.00 MB'],
  ])('formats %i bytes as %s', (bytes, expected) => {
    expect(prettifyFileSize(bytes)).toBe(expected);
  });

  it.each([
    // `toPrecision(3)` renders these as `1.00e+3` — a mantissa of 1000–1023 occurs for every
    // size just short of the next unit boundary.
    [999, '999 B'],
    [1000, '1000 B'],
    [1023, '1023 B'],
    [1023 * 1024, '1023 kB'],
    [2000 * 1024 ** 3, '2000 GB'],
  ])('does not fall back to exponential notation for %i bytes', (bytes, expected) => {
    expect(prettifyFileSize(bytes)).toBe(expected);
  });

  it('rounds to a whole number when asked for no precision', () => {
    expect(prettifyFileSize(61_440, 0)).toBe('60 kB');
  });

  it('avoids exponential notation at lower precisions too', () => {
    // `toPrecision(1)` would give `6e+1`.
    expect(prettifyFileSize(61_440, 1)).toBe('60 kB');
  });

  it('treats precision as significant digits, not fraction digits', () => {
    // Worth pinning down: `FileSizeIndicator` passes its `maximumFractionDigits` prop straight
    // into this argument, but one significant digit rounds 1.5 kB to 2 kB rather than keeping
    // one decimal.
    expect(prettifyFileSize(1536, 1)).toBe('2 kB');
    expect(prettifyFileSize(1536, 2)).toBe('1.5 kB');
  });
});
