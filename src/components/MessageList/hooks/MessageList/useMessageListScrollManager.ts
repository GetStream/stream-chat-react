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

// How the current older-page pagination cycle restores the viewport once messages are prepended.
// Chosen when loading starts, reset to `idle` after the prepend is handled. `preserve-anchor`: it
// started near the top, so restore the captured anchor (a message row `id` and its `offsetTop` from
// the container's top edge) to its previous offset after the prepend shifts the DOM down.
type OlderPaginationState =
  | { anchor: null; mode: 'idle' }
  | { anchor: { id: string; offsetTop: number }; mode: 'preserve-anchor' };

const IDLE_OLDER_PAGINATION: OlderPaginationState = { anchor: null, mode: 'idle' };

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
 * Preserves the scroll position when the rendered messages change. Older-page prepends keep the
 * message the user was looking at in place, wherever near the top loading started (the very top
 * included). Appends auto-scroll only when the user was near the bottom or sent the message. A
 * window switch to the newest messages shows the bottom of the list, unless a jump positions it; a
 * switch to an older window is left to the jump that caused it. Any other growth (overlapping
 * pages) skips the prepend heuristics, as the old and new arrays are not one contiguous list.
 *
 * @returns Scroll handler that records the container's `scrollTop` and, while an anchored
 * older-page load is in flight, refreshes the anchor from `getLatestAnchor`.
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
      // While disabled, still refresh the cached list shape so the next enabled render compares
      // against the latest DOM state.
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
      // Read the live DOM scroll position, not the cached ref: `scrollToBottom()` may have run
      // before the async scroll event updated the ref (common on initial mount).
      const liveMeasures = scrollContainerMeasures();
      // Without overflow (e.g. content not at its final height yet due to font loading) the scroll
      // position is meaningless, so there is no viewport to preserve.
      const hasOverflow = liveMeasures.scrollHeight > liveMeasures.offsetHeight;
      // Loading that starts away from the top (e.g. newer messages) prepends nothing.
      const isNearTop = liveMeasures.scrollTop < loadMoreScrollThreshold;
      const capturedAnchor = hasOverflow && isNearTop ? captureAnchor() : null;

      olderPaginationState.current = capturedAnchor
        ? { anchor: capturedAnchor, mode: 'preserve-anchor' }
        : IDLE_OLDER_PAGINATION;
    }

    // Evaluate bottom proximity from the previous render, before new content changes the list
    // height.
    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - scrollTop.current <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      const messageListChange = getMessageListChange(prevMessages, newMessages);

      // A clean prepend: older messages were inserted ahead of the viewport. Keep the anchor
      // captured when loading started in place, then reset the mode.
      if (messageListChange === 'older-prepended') {
        const preservedAnchor =
          olderPaginationState.current.mode === 'preserve-anchor' &&
          (finishedLoadingOlder || loadingMore)
            ? olderPaginationState.current.anchor
            : null;

        if (preservedAnchor) {
          restoreAnchor(preservedAnchor);
        } else if (scrollTop.current < loadMoreScrollThreshold) {
          // No stable DOM anchor to restore: compensate for the inserted page height, which is
          // less accurate than anchor restoration but still avoids a full jump.
          const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;
          onScrollBy(listHeightDelta);
        }

        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // A clean append: the list grew downward. Auto-scroll only for self-sent messages or when
      // the user was already near the bottom.
      else if (messageListChange === 'newer-appended') {
        if (justReachedLatestMessageSet) {
          // Merging into the latest page is handled by dedicated logic higher up; returning
          // avoids undoing it with a normal append scroll.
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
      // A window switch: nothing the user was looking at is rendered any more (e.g. a reconnect
      // across a gap replaced the loaded messages with the newest page). Left alone, `scrollTop`
      // would land on an arbitrary spot, usually the top, which also loads an older page. The
      // newest messages are read from the bottom. A jump positions the list itself through the
      // message-focus signal, and a switch to an older window is left to the jump that shows it.
      else if (messageListChange === 'window-switched') {
        const showsNewestMessages = !hasMoreNewer;
        // A focus signal outlives its jump (it clears a while after the message is seen), so only
        // one whose message this window renders positions the list.
        const isJumpTargetRendered =
          !!focusedMessageId &&
          newMessages.some((message) => message.id === focusedMessageId);

        if (showsNewestMessages && !isJumpTargetRendered) {
          scrollToBottom();
        }

        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // Neither a pure prepend, a pure append nor a window switch (e.g. overlapping pages): skip
      // the prepend heuristics.
      else if (messageListChange === 'grew-otherwise') {
        olderPaginationState.current = IDLE_OLDER_PAGINATION;
      }
      // The list did not grow, but the last message may have a new reaction or reply.
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
          olderPaginationState.current = IDLE_OLDER_PAGINATION;
        }
      }
    }

    rememberRenderedState(newMeasures);
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
