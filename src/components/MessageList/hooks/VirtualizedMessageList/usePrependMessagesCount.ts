import { useMemo, useRef } from 'react';

import type { StreamMessage } from '../../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../../types/types';

const STATUSES_EXCLUDED_FROM_PREPEND = ({
  failed: true,
  sending: true,
} as const) as Record<string, boolean>;

export function usePrependedMessagesCount<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(messages: StreamMessage<StreamChatGenerics>[], hasDateSeparator: boolean) {
  const firstRealMessageIndex = hasDateSeparator ? 1 : 0;
  const firstMessageOnFirstLoadedPage = useRef<StreamMessage<StreamChatGenerics>>();
  const previousFirstMessageOnFirstLoadedPage = useRef<StreamMessage<StreamChatGenerics>>();
  const previousNumItemsPrepended = useRef(0);

  const numItemsPrepended = useMemo(() => {
    if (!messages || !messages.length) {
      previousNumItemsPrepended.current = 0;
      return 0;
    }

    const currentFirstMessage = messages?.[firstRealMessageIndex];

    const noNewMessages =
      currentFirstMessage?.id === previousFirstMessageOnFirstLoadedPage.current?.id;

    // This is possible only, when sending messages very quickly (basically single char messages submitted like a crazy) in empty channel (first page)
    // Optimistic UI update, when sending messages, can lead to a situation, when
    // the order of the messages changes for a moment. This can happen, when a user
    // sends multiple messages withing few milliseconds. E.g. we send a message A
    // then message B. At first we have message array with both messages of status "sending"
    // then response for message A is received with a new - later - created_at timestamp
    // this leads to rearrangement of 1.B ("sending"), 2.A ("received"). Still firstMessageOnFirstLoadedPage.current
    // points to message A, but now this message has index 1 => previousNumItemsPrepended.current === 1
    // That in turn leads to incorrect index calculation in VirtualizedMessageList trying to access a message
    // at non-existent index. Therefore, we ignore messages of status "sending" / "failed" in order they are
    // not considered as prepended messages.
    const firstMsgMovedAfterMessagesInExcludedStatus = !!(
      currentFirstMessage?.status && STATUSES_EXCLUDED_FROM_PREPEND[currentFirstMessage.status]
    );

    if (noNewMessages || firstMsgMovedAfterMessagesInExcludedStatus) {
      return previousNumItemsPrepended.current;
    }

    if (!firstMessageOnFirstLoadedPage.current) {
      firstMessageOnFirstLoadedPage.current = currentFirstMessage;
    }
    previousFirstMessageOnFirstLoadedPage.current = currentFirstMessage;
    // if new messages were prepended, find out how many
    // start with this number because there cannot be fewer prepended items than before
    for (
      let prependedMessageCount = previousNumItemsPrepended.current;
      prependedMessageCount < messages.length;
      prependedMessageCount += 1
    ) {
      const messageIsFirstOnFirstLoadedPage =
        messages[prependedMessageCount].id === firstMessageOnFirstLoadedPage.current?.id;

      if (messageIsFirstOnFirstLoadedPage) {
        previousNumItemsPrepended.current = prependedMessageCount - firstRealMessageIndex;
        return previousNumItemsPrepended.current;
      }
    }

    // if no match has found, we have jumped - reset the prepended item count.
    firstMessageOnFirstLoadedPage.current = currentFirstMessage;
    previousNumItemsPrepended.current = 0;
    return 0;
    // TODO: there's a bug here, the messages prop is the same array instance (something mutates it)
    // that's why the second dependency is necessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstRealMessageIndex, messages, messages?.length]);

  return numItemsPrepended;
}
