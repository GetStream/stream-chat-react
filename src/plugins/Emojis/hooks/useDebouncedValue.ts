import { useEffect, useState } from 'react';

/**
 * Returns `value` debounced by `delayMs`: the result only catches up to the latest value
 * once `delayMs` has elapsed without a further change. Version-safe across React 17–19
 * (unlike `useDeferredValue`, which is React 18+).
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
};
