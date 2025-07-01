export function prettifyFileSize(bytes: number, precision = 3) {
  const units = ['B', 'kB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const mantissa = bytes / 1024 ** exponent;
  const formattedMantissa =
    precision === 0 ? Math.round(mantissa).toString() : mantissa.toPrecision(precision);
  return `${formattedMantissa} ${units[exponent]}`;
}
