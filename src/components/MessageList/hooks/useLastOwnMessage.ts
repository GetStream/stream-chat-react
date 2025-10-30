import { useMemo } from 'react';
import { findReverse } from '../../../utils/findReverse';
import type { LocalMessage } from 'stream-chat';

// fixme: we should be able to retrieve last own message quickly from the LLC. Should be done when refactoring the LLC Channel state to reactive.
export const useLastOwnMessage = ({
  messages,
  ownUserId,
}: {
  messages?: LocalMessage[];
  ownUserId?: string;
}) =>
  useMemo(
    () =>
      messages && findReverse(messages, (msg) => (msg.user && msg.user.id) === ownUserId),
    [messages, ownUserId],
  );
