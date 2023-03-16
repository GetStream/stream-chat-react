import { useMemo, useRef } from 'react';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

const STATUSES_EXCLUDED_FROM_PREPEND = ['sending', 'failed'];

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
    let adjustPrependedMessageCount = 0;
    for (let i = previousNumItemsPrepended.current; i < messages.length; i += 1) {
      // Optimistic UI update, when sending messages, can lead to a situation, when
      // the order of the messages changes for a moment. This can happen, when a user
      // sends multiple messages withing few milliseconds. E.g. we send a message A
      // then message B. At first we have message array with both messages of status "sending"
      // then response for message A is received with a new - later - created_at timestamp
      // this leads to rearrangement of 1.B ("sending"), 2.A ("received"). Still firstMessageId.current
      // points to message A, but now this message has index 1 => previousNumItemsPrepended.current === 1
      // That in turn leads to incorrect index calculation in VirtualizedMessageList trying to access a message
      // at non-existent index. Therefore, we ignore messages of status "sending" / "failed" in order they are
      // not considered as prepended messages.
      if (
        messages[i]?.status &&
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        STATUSES_EXCLUDED_FROM_PREPEND.includes(messages[i].status!) &&
        messages[i].id !== firstMessageId.current
      ) {
        adjustPrependedMessageCount++;
      }
      if (messages[i].id === firstMessageId.current) {
        previousNumItemsPrepended.current = i - adjustPrependedMessageCount;
        return previousNumItemsPrepended.current;
      }
    }

    // if no match has found, we have jumped - reset the prepended item count.
    firstMessageId.current = currentFirstMessageId;
    previousNumItemsPrepended.current = 0;
    return 0;
    // TODO: there's a bug here, the messages prop is the same array instance (something mutates it)
    // that's why the second dependency is necessary
  }, [messages, messages?.length]);

  return numItemsPrepended;
}
