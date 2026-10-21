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
  /**
   * The ID of the message a jump is bringing into view (the paginator's message-focus signal).
   * A switch to a window that renders it is positioned by the jump, not by this hook.
   */
  focusedMessageId?: string;
  /** Whether newer messages exist beyond the rendered ones, i.e. the list does not show the newest. */
  hasMoreNewer?: boolean;
  justReachedLatestMessageSet?: boolean;
  loadMoreScrollThreshold: number;
  loadingMore?: boolean;
  messages: LocalMessage[];
  onScrollBy: (scrollBy: number) => void;
  restoreAnchor: (anchor: { id: string; offsetTop: number }) => void;
  scrollContainerMeasures: () => ContainerMeasures;
  scrolledUpThreshold: number;
  scrollToBottom: () => void;
  showNewMessages: () => void;
  suppressAutoscroll?: boolean;
};

// Tracks how the current older-page pagination cycle should restore the viewport
// once messages are prepended. The mode is chosen when loading starts and cleared
// after the prepend has been handled.
//
// Modes:
// - `idle`: there is no active older-page restoration strategy
// - `preserve-anchor`: pagination started near the top, so restore the captured
//   anchor message to its previous viewport offset
type OlderPaginationState =
  | { anchor: null; mode: 'idle' }
  | { anchor: { id: string; offsetTop: number }; mode: 'preserve-anchor' };

const IDLE_OLDER_PAGINATION: OlderPaginationState = { anchor: null, mode: 'idle' };

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
 * Whether the server has the message. A message being sent, one that failed to send and a
 * client-side error message are listed with the newest messages whichever window shows them, so
 * they say nothing about which stretch of the channel the list shows.
 */
const isServerConfirmedMessage = (message: LocalMessage) =>
  message.status !== 'sending' && message.status !== 'failed' && message.type !== 'error';

/**
 * Whether the list now shows a different stretch of the channel: the previous messages were
 * replaced rather than extended, so no server-confirmed message is rendered in both. A list that
 * had nothing confirmed (e.g. before the first page) or is now empty has not switched.
 */
const isWindowSwitch = (prevMessages: LocalMessage[], newMessages: LocalMessage[]) => {
  const prevConfirmedMessages = prevMessages.filter(isServerConfirmedMessage);
  if (!prevConfirmedMessages.length || !newMessages.length) return false;

  const newMessageIds = new Set(newMessages.map((message) => message.id));
  return !prevConfirmedMessages.some((message) => newMessageIds.has(message.id));
};

/**
 * How the rendered messages changed since the previous render:
 * - `older-prepended`: an older page was inserted above the previous messages (an empty list
 *   receiving its first page counts as one)
 * - `newer-appended`: newer messages were added below the previous messages
 * - `window-switched`: another stretch of the channel replaced the previous messages
 * - `grew-otherwise`: the list grew in a way that is none of the above (e.g. overlapping pages)
 * - `not-grown`: the same messages, updated in place, or fewer of them
 */
type MessageListChange =
  | 'older-prepended'
  | 'newer-appended'
  | 'window-switched'
  | 'grew-otherwise'
  | 'not-grown';

const getMessageListChange = (
  prevMessages: LocalMessage[],
  newMessages: LocalMessage[],
): MessageListChange => {
  const grew = prevMessages.length < newMessages.length;
  if (grew && messageIdsMatchAsSuffix(prevMessages, newMessages))
    return 'older-prepended';
  if (grew && messageIdsMatchAsPrefix(prevMessages, newMessages)) return 'newer-appended';
  if (isWindowSwitch(prevMessages, newMessages)) return 'window-switched';
  return grew ? 'grew-otherwise' : 'not-grown';
};

/**
 * Coordinates scroll-position preservation when the rendered message array changes.
 *
 * The hook distinguishes these cases:
 * 1. Older-page pagination prepends messages at the top of the list.
 *    This path keeps the message the user was looking at in place, wherever near
 *    the top they were when pagination started (the very top included).
 * 2. Newer messages append to the bottom of the list.
 *    This path preserves normal chat behavior by auto-scrolling only when the
 *    user was already near the bottom or the appended message is the user's own.
 * 3. Window switches: another stretch of the channel replaces the rendered one.
 *    Nothing the user was looking at remains, so a switch to the newest messages
 *    shows the bottom of the list, unless a jump is positioning the list itself.
 *    A switch to an older window is left to the jump that caused it.
 * 4. Overlapping page switches.
 *    These intentionally bypass prepend heuristics because the old and new arrays
 *    are not comparable as a single contiguous list.
 */
export function useMessageListScrollManager(params: UseMessageListScrollManagerParams) {
  const {
    captureAnchor,
    disableScrollManagement = false,
    focusedMessageId,
    hasMoreNewer = false,
    justReachedLatestMessageSet = false,
    loadingMore = false,
    loadMoreScrollThreshold,
    onScrollBy,
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
  const olderPaginationState = useRef<OlderPaginationState>(IDLE_OLDER_PAGINATION);
  const previousLoadingMoreRef = useRef(loadingMore);
  const scrollTop = useRef(0);

  useLayoutEffect(() => {
    // The next render compares its messages and measures against these.
    const rememberRenderedState = (renderedMeasures: ContainerMeasures) => {
      messages.current = params.messages;
      measures.current = renderedMeasures;
      previousLoadingMoreRef.current = loadingMore;
    };

    if (disableScrollManagement) {
      // Even while management is disabled we still refresh the cached list shape,
      // so the next enabled render compares against the most recent DOM state.
      rememberRenderedState(scrollContainerMeasures());
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
      // Read the live DOM scroll position instead of the cached ref so we get
      // the correct value even when scrollToBottom() has been called but the
      // async scroll event hasn't updated the ref yet (common on initial mount).
      const liveMeasures = scrollContainerMeasures();
      // When the container doesn't overflow yet (e.g. content hasn't reached its
      // final height due to font loading) the scroll position is meaningless, so
      // there is no viewport to preserve.
      const hasOverflow = liveMeasures.scrollHeight > liveMeasures.offsetHeight;
      // Loading that starts away from the top (e.g. newer messages) prepends nothing.
      const isNearTop = liveMeasures.scrollTop < loadMoreScrollThreshold;
      const capturedAnchor = hasOverflow && isNearTop ? captureAnchor() : null;

      olderPaginationState.current = capturedAnchor
        ? { anchor: capturedAnchor, mode: 'preserve-anchor' }
        : IDLE_OLDER_PAGINATION;
    }

    // Evaluate bottom proximity from the previous render, before any new content
    // changes the list height and invalidates the prior bottom distance.
    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - scrollTop.current <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      const messageListChange = getMessageListChange(prevMessages, newMessages);

      // A clean prepend means older messages were inserted ahead of the current
      // viewport. Keep the anchor captured when loading started in place, then
      // clear the mode for the next pagination cycle.
      if (messageListChange === 'older-prepended') {
        const preservedAnchor =
          olderPaginationState.current.mode === 'preserve-anchor' &&
          (finishedLoadingOlder || loadingMore)
            ? olderPaginationState.current.anchor
            : null;

        if (preservedAnchor) {
          restoreAnchor(preservedAnchor);
        } else if (scrollTop.current < loadMoreScrollThreshold) {
          // Fallback for prepends when there is no stable DOM anchor to restore.
          // This is less accurate than anchor restoration, but still avoids a full
          // jump by compensating for the inserted page height.
          const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;
          onScrollBy(listHeightDelta);
        }

        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // A clean append means the list grew downward. Preserve the usual chat
      // semantics: auto-scroll only for self-sent messages or when the user was
      // already close enough to bottom.
      else if (messageListChange === 'newer-appended') {
        if (justReachedLatestMessageSet) {
          // Merging into the latest page is handled by dedicated logic higher up.
          // Returning here avoids undoing that behavior with a normal append scroll.
          rememberRenderedState(newMeasures);
          return;
        }

        const lastMessageIsFromCurrentUser = lastNewMessage.user?.id === client.userID;

        if (!suppressAutoscroll && (lastMessageIsFromCurrentUser || wasAtBottom)) {
          scrollToBottom();
        } else {
          showNewMessages();
        }
      }
      // Nothing the user was looking at is rendered any more (e.g. a reconnect across a
      // gap replaced the loaded messages with the newest page). Left alone, scrollTop would
      // land on an arbitrary spot, usually the top, which also loads an older page. The
      // newest messages are read from the bottom. A jump to a message positions the list
      // itself through the message-focus signal, and a switch to an older window is left
      // to the jump that shows it.
      else if (messageListChange === 'window-switched') {
        const showsNewestMessages = !hasMoreNewer;
        // A focus signal outlives its jump (it clears a while after the message is seen), so
        // only one whose message this window renders is positioning the list.
        const isJumpTargetRendered =
          !!focusedMessageId &&
          newMessages.some((message) => message.id === focusedMessageId);

        if (showsNewestMessages && !isJumpTargetRendered) {
          scrollToBottom();
        }

        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // An overlapping page switch: the old and new arrays are not comparable as a
      // single contiguous list, so avoid applying prepend heuristics.
      else if (messageListChange === 'grew-otherwise') {
        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // message list length didn't grow, but check if last message had reaction/reply update
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
          olderPaginationState.current = IDLE_OLDER_PAGINATION;
        }
      }
    }

    rememberRenderedState(newMeasures);
    // MERGE-RECONCILE: deps are the UNION of master's anchor-based scroll params and
    // PR #2909's suppressAutoscroll (exhaustive-deps is disabled, so extra deps are safe).
    // The scroll logic here (master) and useScrollLocationLogic (PR base) diverged;
    // verify the two scroll paths cooperate rather than double-manage scrolling.
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
