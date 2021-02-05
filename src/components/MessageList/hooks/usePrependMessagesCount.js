// @ts-check
import { useRef, useMemo } from 'react';

/**
 * @param {Array<{ id: string }> | undefined} messages,
 */
export const usePrependedMessagesCount = (messages) => {
  const firstMessageId = useRef(messages && messages.length && messages[0].id);
  const earliestMessageId = useRef(
    messages && messages.length && messages[0].id,
  );
  const previousNumItemsPrepended = useRef(0);
  const numItemsPrepended = useMemo(() => {
    if (!messages || !messages.length) {
      return 0;
    }
    // if no new messages were prepended, return early (same amount as before)
    if (messages[0]?.id === earliestMessageId.current) {
      return previousNumItemsPrepended.current;
    }

    if (!firstMessageId.current) {
      firstMessageId.current = messages[0].id;
    }
    earliestMessageId.current = messages[0].id;
    // if new messages were prepended, find out how many
    // start with this number because there cannot be fewer prepended items than before
    for (
      let i = previousNumItemsPrepended.current;
      i < messages.length;
      i += 1
    ) {
      if (messages[i].id === firstMessageId.current) {
        previousNumItemsPrepended.current = i;
        return i;
      }
    }
    return 0;
    // TODO: there's a bug here, the messages prop is the same array instance (something mutates it)
    // that's why the second dependency is necessary
  }, [messages, messages?.length]);

  return numItemsPrepended;
};
