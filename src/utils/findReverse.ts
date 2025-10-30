// last own message should be tracked in the low-level client
export const findReverse = <T>(
  items: T[],
  matches: (items: T) => boolean,
): T | undefined => {
  for (let i = items.length - 1; i > 0; i -= 1) {
    if (matches(items[i])) {
      return items[i];
    }
  }

  return undefined;
};
