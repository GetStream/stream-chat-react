export function prettifyFileSize(bytes: number, precision = 3) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent =
    bytes === 0
      ? 0
      : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const mantissa = bytes / 1024 ** exponent;
  const formattedMantissa =
    // `toPrecision` switches to exponential notation (`1.00e+3`) when the value needs more integer
    // digits than the requested significant digits, e.g. a mantissa of 1000 to 1023 at the default
    // precision of 3. Such a mantissa has no fraction worth showing, so it is rounded instead.
    precision === 0 || mantissa >= 10 ** precision
      ? Math.round(mantissa).toString()
      : mantissa.toPrecision(precision);
  return `${formattedMantissa} ${units[exponent]}`;
}
