export function prettifyFileSize(bytes: number, precision = 3) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent =
    bytes === 0
      ? 0
      : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const mantissa = bytes / 1024 ** exponent;
  // `toPrecision` switches to exponential notation as soon as the value needs more integer digits
  // than the requested significant digits, so any size just below the next unit boundary came out
  // as `1.00e+3 B` (1000-1023 B, and the same range in kB/MB/GB). Such a mantissa has no fraction
  // worth showing at this precision, so round it to an integer instead.
  const formattedMantissa =
    precision === 0 || mantissa >= 10 ** precision
      ? Math.round(mantissa).toString()
      : mantissa.toPrecision(precision);
  return `${formattedMantissa} ${units[exponent]}`;
}
