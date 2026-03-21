import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_HIDE_DELAY_MS = 2000;

export type TypingEntry = {
  user?: { id?: string; name?: string; image?: string };
  parent_id?: string;
};

/**
 * Derive a stable key from typing users so that the effect only runs when the
 * actual set of users (by id) changes, not on every render due to new array
 * references.
 *
 * Important: callers must pass entries where `user` is an object with an `id`
 * field (not a plain string). If `user?.id` is undefined for every entry the
 * key degenerates to an empty string, the memo returns a new array each time
 * it is "invalidated" by React, and `setDisplayUsers` in the effect below will
 * loop infinitely because it always receives a fresh reference.
 */
const useStableTypingUsers = (typingUsers: readonly TypingEntry[]) => {
  const key = typingUsers
    .map((entry) => entry.user?.id ?? '')
    .sort()
    .join(',');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => [...typingUsers], [key]);
};

/**
 * Debounces hiding the typing indicator: when typing users go to zero, keep showing for delayMs
 * to avoid flicker when typing stops and starts again quickly. Returns the list to display
 * (current typers or last non-empty list during the debounce period). Show the indicator
 * when displayUsers.length > 0.
 */
export function useDebouncedTypingActive(
  typingUsers: readonly TypingEntry[],
  delayMs: number = DEFAULT_HIDE_DELAY_MS,
): { displayUsers: TypingEntry[] } {
  const stableTypingUsers = useStableTypingUsers(typingUsers);
  const [displayUsers, setDisplayUsers] = useState<TypingEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadTypersRef = useRef(false);

  useEffect(() => {
    if (stableTypingUsers.length > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      hadTypersRef.current = true;
      setDisplayUsers(stableTypingUsers);
      return;
    }

    if (stableTypingUsers.length === 0 && hadTypersRef.current && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        hadTypersRef.current = false;
        setDisplayUsers([]);
      }, delayMs);
    }
  }, [stableTypingUsers, delayMs]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { displayUsers };
}
