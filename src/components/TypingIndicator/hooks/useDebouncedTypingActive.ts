import { useEffect, useRef, useState } from 'react';

const DEFAULT_HIDE_DELAY_MS = 2000;

export type TypingEntry = {
  user?: { id?: string; name?: string; image?: string };
  parent_id?: string;
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
  const [displayUsers, setDisplayUsers] = useState<TypingEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadTypersRef = useRef(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      hadTypersRef.current = true;
      setDisplayUsers([...typingUsers]);
      return;
    }

    if (typingUsers.length === 0 && hadTypersRef.current && !timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        hadTypersRef.current = false;
        setDisplayUsers([]);
      }, delayMs);
    }
  }, [typingUsers, delayMs]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { displayUsers };
}
