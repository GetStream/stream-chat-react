import { useMemo, useRef } from 'react';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export function usePrependedMessagesCount<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(messages: StreamMessage<StreamChatGenerics>[], hasDateSeparator: boolean) {
  const firstRealMessageIndex = hasDateSeparator ? 1 : 0;
  const firstMessageId = useRef<string>();
  const earliestMessageId = useRef<string>();
  const previousNumItemsPrepended = useRef(0);

  const numItemsPrepended = useMemo(() => {
    if (!messages || !messages.length) {
      previousNumItemsPrepended.current = 0;
      return 0;
    }

    const currentFirstMessageId = messages?.[firstRealMessageIndex]?.id;
    // if no new messages were prepended, return early (same amount as before)
    if (currentFirstMessageId === earliestMessageId.current) {
      return previousNumItemsPrepended.current;
    }

    if (!firstMessageId.current) {
      firstMessageId.current = currentFirstMessageId;
    }
    earliestMessageId.current = currentFirstMessageId;
    // if new messages were prepended, find out how many
    // start with this number because there cannot be fewer prepended items than before
    for (let i = previousNumItemsPrepended.current; i < messages.length; i += 1) {
      if (messages[i].id === firstMessageId.current) {
        previousNumItemsPrepended.current = i;
        return i;
      }
    }

    // if no match has found, we have jumped - reset the prepend item count.
    firstMessageId.current = currentFirstMessageId;
    previousNumItemsPrepended.current = 0;
    return 0;
    // TODO: there's a bug here, the messages prop is the same array instance (something mutates it)
    // that's why the second dependency is necessary
  }, [messages, messages?.length]);

  return numItemsPrepended;
}
