import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventPayload } from 'stream-chat';

const DEFAULT_HIDE_DELAY_MS = 2000;

export type TypingEntry = EventPayload<'typing.start' | 'typing.stop'>;

// Memoizes the typing users by ID, so a new array with the same users keeps its reference. Entries
// without `user.id` are not told apart, and a single one has the same key as an empty list.
const useStableTypingUsers = (typingUsers: readonly TypingEntry[]) => {
  const key = typingUsers
    .map((entry) => entry.user?.id ?? '')
    .sort()
    .join(',');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => [...typingUsers], [key]);
};

/**
 * Keeps the last non-empty list of typing users for `delayMs` after the users drop to zero, so a
 * short pause in typing does not flicker the indicator. `delayMs` defaults to 2000. Returns the
 * list to display; show the indicator while it is non-empty.
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
