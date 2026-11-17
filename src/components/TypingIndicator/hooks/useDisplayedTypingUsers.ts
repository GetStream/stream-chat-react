import { useEffect, useMemo, useState } from 'react';
import type { Channel } from 'stream-chat';

import { type TypingEntry, useTypingUsers } from './useTypingUsers';

const DEFAULT_HIDE_DELAY_MS = 2000;

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

/** The last non-empty list of typing users, with the channel and thread it was read from. */
type LastTyping = {
  channel: Channel;
  parentId: string | undefined;
  users: TypingEntry[];
};

const isFromSource = (
  lastTyping: LastTyping | null,
  channel: Channel,
  parentId: string | undefined,
): lastTyping is LastTyping =>
  lastTyping?.channel === channel && lastTyping.parentId === parentId;

/**
 * The other users typing in `channel`, or with `parentId` in that thread, for a typing indicator to
 * show. After they stop, it keeps returning them for `delayMs` (default 2000), so a short pause in
 * typing does not flicker the indicator. The kept users belong to the channel and thread they were
 * read from: for another channel or thread it returns that one's typing users at once.
 *
 * While the channel's `typingEvents.enabled` is false nobody counts as typing, so users already
 * returned are kept for `delayMs` and then the list stays empty.
 *
 * A custom header can switch between typing and other content on whether the list is empty, and
 * render `TypingIndicatorHeader`, which keeps typing for the same delay.
 */
export const useDisplayedTypingUsers = (
  channel: Channel,
  parentId?: string,
  delayMs: number = DEFAULT_HIDE_DELAY_MS,
): readonly TypingEntry[] => {
  const typingUsers = useStableTypingUsers(useTypingUsers(channel, parentId));
  const [lastTyping, setLastTyping] = useState<LastTyping | null>(null);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setLastTyping({ channel, parentId, users: typingUsers });
      return;
    }

    // Users kept from another channel or thread are dropped at once, so they do not come back
    // when the user returns there within the delay.
    setLastTyping((previous) =>
      isFromSource(previous, channel, parentId) ? previous : null,
    );
    const timer = setTimeout(() => setLastTyping(null), delayMs);
    return () => clearTimeout(timer);
  }, [channel, delayMs, parentId, typingUsers]);

  if (typingUsers.length > 0 || !isFromSource(lastTyping, channel, parentId)) {
    // `typingUsers` is memoized, so an empty result keeps its reference across renders.
    return typingUsers;
  }

  return lastTyping.users;
};
