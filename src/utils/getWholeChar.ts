/**
 * Returns the whole character at index `i`, so a surrogate pair comes back as one string.
 *
 * @param str - String to read from.
 * @param i - Character index.
 * @returns The character, or `''` when `i` is out of range or points at the low half of a pair.
 * @throws A string (not an `Error`) when a surrogate half has no matching partner.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt#getting_whole_characters
 */
export const getWholeChar = (str: string, i: number) => {
  const code = str.charCodeAt(i);

  if (Number.isNaN(code)) return '';

  if (code < 0xd800 || code > 0xdfff) return str.charAt(i);

  if (0xd800 <= code && code <= 0xdbff) {
    if (str.length <= i + 1) {
      throw 'High surrogate without following low surrogate';
    }

    const next = str.charCodeAt(i + 1);

    if (0xdc00 > next || next > 0xdfff) {
      throw 'High surrogate without following low surrogate';
    }

    return str.charAt(i) + str.charAt(i + 1);
  }

  if (i === 0) {
    throw 'Low surrogate without preceding high surrogate';
  }

  const prev = str.charCodeAt(i - 1);

  if (0xd800 > prev || prev > 0xdbff) {
    throw 'Low surrogate without preceding high surrogate';
  }

  return '';
};
