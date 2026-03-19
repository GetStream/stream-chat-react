import { useLayoutEffect, useRef } from 'react';

import { useChatContext } from '../../../../context/ChatContext';
import type { LocalMessage } from 'stream-chat';

export type ContainerMeasures = {
  offsetHeight: number;
  scrollHeight: number;
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
};

// Tracks how the current older-page pagination cycle should restore the viewport
// once messages are prepended. The mode is chosen when loading starts and cleared
// after the prepend has been handled.
//
// Modes:
// - `idle`: there is no active older-page restoration strategy
// - `stick-to-top`: pagination started from the absolute top, so keep the newly
//   loaded page pinned to the top of the container
// - `preserve-anchor`: pagination started near the top but not at the absolute
//   top, so restore the captured anchor message to its previous viewport offset
type OlderPaginationState =
  | { anchor: null; mode: 'idle' }
  | { anchor: null; mode: 'stick-to-top' }
  | { anchor: { id: string; offsetTop: number }; mode: 'preserve-anchor' };

// An "anchor" is the currently visible message row we want to keep visually pinned
// to the same spot in the viewport while older messages are inserted above it.
// It stores:
// - `id`: which rendered message row should stay stable
// - `offsetTop`: how far that row sits from the top edge of the scroll container
//
// After a prepend, the DOM shifts downward. Restoring the anchor means finding the
// same message row again and correcting scrollTop until it returns to that offset.

// When all previous messages appear at the start of the new array, the growth
// happened at the bottom of the list.
const messageIdsMatchAsPrefix = (
  prevMessages: LocalMessage[],
  newMessages: LocalMessage[],
) => prevMessages.every((message, index) => message.id === newMessages[index]?.id);

// When all previous messages appear at the end of the new array, the growth
// happened at the top of the list.
const messageIdsMatchAsSuffix = (
  prevMessages: LocalMessage[],
  newMessages: LocalMessage[],
) =>
  prevMessages.every(
    (message, index) =>
      message.id === newMessages[newMessages.length - prevMessages.length + index]?.id,
  );

/**
 * Coordinates scroll-position preservation when the rendered message array changes.
 *
 * The hook distinguishes three broad cases:
 * 1. Older-page pagination prepends messages at the top of the list.
 *    This path either sticks to the top of the new page or restores a captured
 *    message anchor, depending on where the user was when pagination started.
 * 2. Newer messages append to the bottom of the list.
 *    This path preserves normal chat behavior by auto-scrolling only when the
 *    user was already near the bottom or the appended message is the user's own.
 * 3. Disjunct/overlapping page switches.
 *    These intentionally bypass prepend heuristics because the old and new arrays
 *    are not comparable as a single contiguous list.
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
  } = params;

  const { client } = useChatContext('useMessageListScrollManager');

  const measures = useRef<ContainerMeasures>({
    offsetHeight: 0,
    scrollHeight: 0,
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
      // Even while management is disabled we still refresh the cached list shape,
      // so the next enabled render compares against the most recent DOM state.
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
      // Older-page pagination uses one of three modes:
      // - `stick-to-top`: user hit the absolute top and wants to keep reading upward
      // - `preserve-anchor`: user was only near the top, so keep the same message in view
      // - `idle`: no restoration needed for this load cycle
      if (scrollTop.current <= 1) {
        olderPaginationState.current = {
          anchor: null,
          mode: 'stick-to-top',
        };
      } else if (scrollTop.current < loadMoreScrollThreshold) {
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

    // Evaluate bottom proximity from the previous render, before any new content
    // changes the list height and invalidates the prior bottom distance.
    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - scrollTop.current <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      if (prevMessages.length < newMessages.length) {
        const messagesAddedToTop = messageIdsMatchAsSuffix(prevMessages, newMessages);
        const messagesAddedToBottom = messageIdsMatchAsPrefix(prevMessages, newMessages);

        // A clean prepend means older messages were inserted ahead of the current
        // viewport. Restore the viewport according to the mode chosen when loading
        // started, then clear the mode for the next pagination cycle.
        if (messagesAddedToTop) {
          const preservedAnchor =
            olderPaginationState.current.mode === 'preserve-anchor' &&
            olderPaginationState.current.anchor &&
            (finishedLoadingOlder || loadingMore)
              ? olderPaginationState.current.anchor
              : null;

          // When pagination was triggered from absolute top, keep the newly
          // loaded page pinned to top instead of restoring the old viewport.
          if (olderPaginationState.current.mode === 'stick-to-top') {
            onScrollToTop();
          } else if (preservedAnchor) {
            restoreAnchor(preservedAnchor);
          } else if (scrollTop.current < loadMoreScrollThreshold) {
            // Fallback for prepends when there is no stable DOM anchor to restore.
            // This is less accurate than anchor restoration, but still avoids a full
            // jump by compensating for the inserted page height.
            const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;
            onScrollBy(listHeightDelta);
          }

          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
        // A clean append means the list grew downward. Preserve the usual chat
        // semantics: auto-scroll only for self-sent messages or when the user was
        // already close enough to bottom.
        else if (messagesAddedToBottom) {
          if (justReachedLatestMessageSet) {
            // Merging into the latest page is handled by dedicated logic higher up.
            // Returning here avoids undoing that behavior with a normal append scroll.
            messages.current = newMessages;
            measures.current = newMeasures;
            previousLoadingMoreRef.current = loadingMore;
            return;
          }

          const lastMessageIsFromCurrentUser = lastNewMessage.user?.id === client.userID;

          if (lastMessageIsFromCurrentUser || wasAtBottom) {
            scrollToBottom();
          } else {
            showNewMessages();
          }
        } else {
          // If the new page is neither a pure prepend nor a pure append, treat it as
          // a disjunct/overlapping page switch and avoid applying prepend heuristics.
          olderPaginationState.current = {
            anchor: null,
            mode: 'idle',
          };
        }
      }
      // message list length didn't change, but check if last message had reaction/reply update
      else {
        const hasNewReactions =
          lastPrevMessage?.latest_reactions?.length !==
          lastNewMessage.latest_reactions?.length;
        const hasNewReplies = lastPrevMessage?.reply_count !== lastNewMessage.reply_count;

        if ((hasNewReactions || hasNewReplies) && wasAtBottom) {
          scrollToBottom();
        }

        if (finishedLoadingOlder) {
          // Clear any older-page mode when the request ends without increasing the
          // rendered list size, so the next pagination cycle starts from a clean slate.
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
      // Keep the anchor fresh while the request is in flight so restoration matches
      // the latest viewport position if the user keeps scrolling before data arrives.
      // The getter keeps normal scroll events cheap by avoiding DOM anchor capture
      // unless anchor preservation is actually active.
      const latestAnchor = getLatestAnchor();
      if (!latestAnchor) return;

      olderPaginationState.current = {
        anchor: latestAnchor,
        mode: 'preserve-anchor',
      };
    }
  };
}
