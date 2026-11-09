import { useMemo, useRef } from 'react';
import type { RenderedMessage } from '../../utils';
import { isLocalMessage } from '../../utils';

const STATUSES_EXCLUDED_FROM_PREPEND = {
  failed: true,
  sending: true,
} as const as Record<string, boolean>;

export function usePrependedMessagesCount(
  messages: RenderedMessage[],
  hasDateSeparator: boolean,
) {
  const firstRealMessageIndex = hasDateSeparator ? 1 : 0;
  const firstMessageOnFirstLoadedPage = useRef<RenderedMessage>(undefined);
  const previousFirstMessageOnFirstLoadedPage = useRef<RenderedMessage>(undefined);
  const previousNumItemsPrepended = useRef(0);

  const numItemsPrepended = useMemo(() => {
    if (!messages || !messages.length) {
      previousNumItemsPrepended.current = 0;
      return 0;
    }

    const currentFirstMessage = messages?.[firstRealMessageIndex];

    const noNewMessages =
      currentFirstMessage?.id === previousFirstMessageOnFirstLoadedPage.current?.id;

    // Messages A then B sent within milliseconds (e.g. in an empty channel) can briefly reorder:
    // when the response for A arrives with a later `created_at`, B ("sending") sorts first and A
    // moves to index 1, which would count as a prepend and make VirtualizedMessageList read a
    // non-existent index. So a first message that is "sending" or "failed" is never a prepend.
    const currentFirstMessageStatus = isLocalMessage(currentFirstMessage)
      ? currentFirstMessage.status
      : undefined;
    const firstMsgMovedAfterMessagesInExcludedStatus = !!(
      currentFirstMessageStatus &&
      STATUSES_EXCLUDED_FROM_PREPEND[currentFirstMessageStatus]
    );

    if (noNewMessages || firstMsgMovedAfterMessagesInExcludedStatus) {
      return previousNumItemsPrepended.current;
    }

    if (!firstMessageOnFirstLoadedPage.current) {
      firstMessageOnFirstLoadedPage.current = currentFirstMessage;
    }
    previousFirstMessageOnFirstLoadedPage.current = currentFirstMessage;
    // Counts the prepended messages, starting at the previous count since it cannot shrink.
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

    // No match means the list jumped: reset the prepended count.
    firstMessageOnFirstLoadedPage.current = currentFirstMessage;
    previousNumItemsPrepended.current = 0;
    return 0;
    // TODO: there's a bug here, the messages prop is the same array instance (something mutates it)
    // that's why the second dependency is necessary
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstRealMessageIndex, messages, messages?.length]);

  return numItemsPrepended;
}
