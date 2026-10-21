import { useLayoutEffect, useRef } from 'react';

import { useChatContext } from '../../../../context/ChatContext';
import type { LocalMessage } from 'stream-chat';

export type ContainerMeasures = {
  offsetHeight: number;
  scrollHeight: number;
  scrollTop: number;
};

export type UseMessageListScrollManagerParams = {
  captureAnchor: () => { id: string; offsetTop: number } | null;
  disableScrollManagement?: boolean;
  justReachedLatestMessageSet?: boolean;
  loadMoreScrollThreshold: number;
  loadingMore?: boolean;
  messages: LocalMessage[];
  onScrollBy: (scrollBy: number) => void;
  onScrollToTop: () => void;
  restoreAnchor: (anchor: { id: string; offsetTop: number }) => void;
  scrollContainerMeasures: () => ContainerMeasures;
  scrolledUpThreshold: number;
  scrollToBottom: () => void;
  showNewMessages: () => void;
  suppressAutoscroll?: boolean;
};

// How the current older-page pagination cycle restores the viewport once messages are prepended.
// Chosen when loading starts, reset to `idle` after the prepend is handled. `stick-to-top`: loading
// started at the absolute top, so keep the new page pinned there. `preserve-anchor`: it started
// near the top, so restore the captured anchor (a message row `id` and its `offsetTop` from the
// container's top edge) to its previous offset after the prepend shifts the DOM down.
type OlderPaginationState =
  | { anchor: null; mode: 'idle' }
  | { anchor: null; mode: 'stick-to-top' }
  | { anchor: { id: string; offsetTop: number }; mode: 'preserve-anchor' };

// All previous messages appear at the start of the new array: the list grew at the bottom.
const messageIdsMatchAsPrefix = (
  prevMessages: LocalMessage[],
  newMessages: LocalMessage[],
) => prevMessages.every((message, index) => message.id === newMessages[index]?.id);

// All previous messages appear at the end of the new array: the list grew at the top.
const messageIdsMatchAsSuffix = (
  prevMessages: LocalMessage[],
  newMessages: LocalMessage[],
) =>
  prevMessages.every(
    (message, index) =>
      message.id === newMessages[newMessages.length - prevMessages.length + index]?.id,
  );

/**
 * Preserves the scroll position when the rendered messages change. Older-page prepends stick to the
 * top or restore a captured anchor, depending on where the user was when loading started. Appends
 * auto-scroll only when the user was near the bottom or sent the message. A change that is neither
 * (a page switch) skips the prepend heuristics, as the old and new arrays are not one contiguous
 * list.
 *
 * @returns Scroll handler that records the container's `scrollTop` and, while an anchored
 * older-page load is in flight, refreshes the anchor from `getLatestAnchor`.
 */
export function useMessageListScrollManager(params: UseMessageListScrollManagerParams) {
  const {
    captureAnchor,
    disableScrollManagement = false,
    justReachedLatestMessageSet = false,
    loadingMore = false,
    loadMoreScrollThreshold,
    onScrollBy,
    onScrollToTop,
    restoreAnchor,
    scrollContainerMeasures,
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages,
    suppressAutoscroll = false,
  } = params;

  const { client } = useChatContext();

  const measures = useRef<ContainerMeasures>({
    offsetHeight: 0,
    scrollHeight: 0,
    scrollTop: 0,
  });
  const messages = useRef<LocalMessage[]>(undefined);
  const olderPaginationState = useRef<OlderPaginationState>({
    anchor: null,
    mode: 'idle',
  });
  const previousLoadingMoreRef = useRef(loadingMore);
  const scrollTop = useRef(0);

  useLayoutEffect(() => {
    if (disableScrollManagement) {
      // While disabled, still refresh the cached list shape so the next enabled render compares
      // against the latest DOM state.
      messages.current = params.messages;
      measures.current = scrollContainerMeasures();
      previousLoadingMoreRef.current = loadingMore;
      return;
    }

    const prevMeasures = measures.current;
    const prevMessages = messages.current;
    const newMessages = params.messages;
    const lastNewMessage = newMessages[newMessages.length - 1] || {};
    const lastPrevMessage = prevMessages?.[prevMessages.length - 1];
    const newMeasures = scrollContainerMeasures();
    const startedLoadingOlder = loadingMore && !previousLoadingMoreRef.current;
    const finishedLoadingOlder = !loadingMore && previousLoadingMoreRef.current;

    if (startedLoadingOlder) {
      // Read the live DOM scroll position, not the cached ref: `scrollToBottom()` may have run
      // before the async scroll event updated the ref (common on initial mount).
      const liveMeasures = scrollContainerMeasures();
      const hasOverflow = liveMeasures.scrollHeight > liveMeasures.offsetHeight;
      const liveScrollTop = liveMeasures.scrollTop;

      // `stick-to-top` at the absolute top, `preserve-anchor` near the top, `idle` otherwise.
      // Without overflow (e.g. content not at its final height yet due to font loading) the scroll
      // position is meaningless, so use `idle` to avoid a false stick-to-top that jumps the list.
      if (!hasOverflow) {
        olderPaginationState.current = {
          anchor: null,
          mode: 'idle',
        };
      } else if (liveScrollTop <= 1) {
        olderPaginationState.current = {
          anchor: null,
          mode: 'stick-to-top',
        };
      } else if (liveScrollTop < loadMoreScrollThreshold) {
        const capturedAnchor = captureAnchor();
        if (capturedAnchor) {
          olderPaginationState.current = {
            anchor: capturedAnchor,
            mode: 'preserve-anchor',
          };
        } else {
          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
      } else {
        olderPaginationState.current = {
          anchor: null,
          mode: 'idle',
        };
      }
    }

    // Evaluate bottom proximity from the previous render, before new content changes the list
    // height.
    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - scrollTop.current <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      if (prevMessages.length < newMessages.length) {
        const messagesAddedToTop = messageIdsMatchAsSuffix(prevMessages, newMessages);
        const messagesAddedToBottom = messageIdsMatchAsPrefix(prevMessages, newMessages);

        // A clean prepend: older messages were inserted ahead of the viewport. Restore it per the
        // mode chosen when loading started, then reset the mode.
        if (messagesAddedToTop) {
          const preservedAnchor =
            olderPaginationState.current.mode === 'preserve-anchor' &&
            olderPaginationState.current.anchor &&
            (finishedLoadingOlder || loadingMore)
              ? olderPaginationState.current.anchor
              : null;

          // Pagination started at the absolute top: keep the new page pinned there instead of
          // restoring the old viewport.
          if (olderPaginationState.current.mode === 'stick-to-top') {
            onScrollToTop();
          } else if (preservedAnchor) {
            restoreAnchor(preservedAnchor);
          } else if (scrollTop.current < loadMoreScrollThreshold) {
            // No stable DOM anchor to restore: compensate for the inserted page height, which is
            // less accurate than anchor restoration but still avoids a full jump.
            const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;
            onScrollBy(listHeightDelta);
          }

          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
        // A clean append: the list grew downward. Auto-scroll only for self-sent messages or when
        // the user was already near the bottom.
        else if (messagesAddedToBottom) {
          if (justReachedLatestMessageSet) {
            // Merging into the latest page is handled by dedicated logic higher up; returning
            // avoids undoing it with a normal append scroll.
            messages.current = newMessages;
            measures.current = newMeasures;
            previousLoadingMoreRef.current = loadingMore;
            return;
          }

          const lastMessageIsFromCurrentUser = lastNewMessage.user?.id === client.userID;

          if (!suppressAutoscroll && (lastMessageIsFromCurrentUser || wasAtBottom)) {
            scrollToBottom();
          } else {
            showNewMessages();
          }
        } else {
          // Neither a pure prepend nor a pure append: treat it as a disjunct or overlapping page
          // switch and skip the prepend heuristics.
          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
      }
      // The length is unchanged, but the last message may have a new reaction or reply.
      else {
        const hasNewReactions =
          lastPrevMessage?.latest_reactions?.length !==
          lastNewMessage.latest_reactions?.length;
        const hasNewReplies = lastPrevMessage?.reply_count !== lastNewMessage.reply_count;

        if ((hasNewReactions || hasNewReplies) && wasAtBottom) {
          scrollToBottom();
        }

        if (finishedLoadingOlder) {
          // Reset the older-page mode when the request ends without growing the rendered list, so
          // the next pagination cycle starts clean.
          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
      }
    }

    messages.current = newMessages;
    measures.current = newMeasures;
    previousLoadingMoreRef.current = loadingMore;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    captureAnchor,
    disableScrollManagement,
    justReachedLatestMessageSet,
    loadingMore,
    measures,
    messages,
    params.messages,
    restoreAnchor,
    scrollContainerMeasures,
    suppressAutoscroll,
  ]);

  return (
    scrollTopValue: number,
    getLatestAnchor: (() => { id: string; offsetTop: number } | null) | null = null,
  ) => {
    scrollTop.current = scrollTopValue;

    if (
      loadingMore &&
      getLatestAnchor &&
      olderPaginationState.current.mode === 'preserve-anchor'
    ) {
      // Keep the anchor fresh while the request is in flight, so restoration matches the latest
      // viewport if the user keeps scrolling. The getter avoids a DOM anchor capture on every
      // scroll event unless anchor preservation is active.
      const latestAnchor = getLatestAnchor();
      if (!latestAnchor) return;

      olderPaginationState.current = {
        anchor: latestAnchor,
        mode: 'preserve-anchor',
      };
    }
  };
}
