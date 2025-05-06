import { nanoid } from 'nanoid';
import { useMemo } from 'react';

/**
 * The ID is generated using the `nanoid` library and is memoized to ensure
 * that it remains the same across renders unless the key changes.
 */
export const useStableId = (key?: string) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const id = useMemo(() => nanoid(), [key]);

  return id;
};
