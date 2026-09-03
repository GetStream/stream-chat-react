import clsx from 'clsx';
import React from 'react';

import {
  useEnrichedMessages,
  useMessageListElements,
  useScrollLocationLogic,
  useUnreadMessagesNotification,
} from './hooks/MessageList';
import { useMarkRead } from './hooks/useMarkRead';

import { NewMessageNotification as DefaultNewMessageNotification } from './NewMessageNotification';
import {
  NotificationList as DefaultNotificationList,
  useNotificationTarget,
} from '../Notifications';
import { useIncomingMessageAnnouncements } from '../Accessibility';
import { UnreadMessagesNotification as DefaultUnreadMessagesNotification } from './UnreadMessagesNotification';

import { DialogManagerProvider, useChannel } from '../../context';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageListContextProvider } from '../../context/MessageListContext';
import { MessageTranslationViewProvider } from '../../context/MessageTranslationViewContext';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';

import { FloatingDateSeparator } from './FloatingDateSeparator';
import type { MessageRenderer } from './renderMessages';
import { defaultRenderMessages } from './renderMessages';
import { useStableId } from '../UtilityComponents/useStableId';
import { useThreadContext } from '../Threads';

import type {
  LocalMessage,
  MessageFocusSignalState,
  MessagePaginatorState,
  UnreadSnapshotState,
} from 'stream-chat';
import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from './utils';
import type { MessageProps } from '../Message/types';

import { DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD } from '../../constants/limits';
import { useLastOwnMessage } from './hooks/useLastOwnMessage';
import { useStateStore } from '../../store';
import type { InfiniteScrollPaginatorProps } from '../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { InfiniteScrollPaginator } from '../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useMessagePaginator } from '../../hooks';
import { ScrollToLatestMessageButton } from './ScrollToLatestMessageButton';

type MessageListWithContextProps = MessageListProps;

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  // hasMore: state.hasMoreTail,
  hasMoreNewer: state.hasMoreHead,
  isLoading: state.isLoading,
  messages: state.items ?? [],
});

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => state;
const messageFocusSignalSelector = (state: MessageFocusSignalState) => ({
  messageFocusSignal: state.signal,
});

// Smooth scrolling for user-initiated scrolls (scroll-to-latest, jump-to-message), honoring the OS
// "reduce motion" preference (WCAG 2.3.3 — `auto` = instant). Read imperatively at scroll time and
// deliberately NOT via a reactive hook: it must add no render churn to MessageList, which would
// perturb the paginator's scroll-position handling (initial/streaming autoscroll stays instant).
const getScrollBehavior = (): ScrollBehavior =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const MessageListWithContext = (props: MessageListWithContextProps) => {
  const channel = useChannel();
  const {
    disableDateSeparator = false,
    groupStyles,
    headerPosition,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    internalInfiniteScrollProps: {
      element: internalListElement = 'div',
      threshold: loadMoreScrollThreshold = DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
      ...restInternalInfiniteScrollProps
    } = {},
    maxTimeBetweenGroupedMessages,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    // messageLimit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
    noGroupByUser = false,
    reactionDetailsSort,
    renderMessages = defaultRenderMessages,
    returnAllReadData = false,
    reviewProcessedMessage,
    showUnreadNotificationAlways,
    sortReactions,
    suppressAutoscroll: suppressAutoscrollFromProps = false,
    unsafeHTML = false,
  } = props;
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const [suppressAutoscrollWhileLoadingOlder, setSuppressAutoscrollWhileLoadingOlder] =
    React.useState(false);
  const suppressAutoscroll =
    suppressAutoscrollFromProps || suppressAutoscrollWhileLoadingOlder;
  const loadingOlderRef = React.useRef(false);

  const [listElement, setListElement] = React.useState<HTMLDivElement | null>(null);

  const { customClasses } = useChatContext();

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListMainPanel = DefaultMessageListMainPanel,
    MessageListWrapper = 'ul',
    NewMessageNotification = DefaultNewMessageNotification,
    NotificationList = DefaultNotificationList,
    TypingIndicator = DefaultTypingIndicator,
    UnreadMessagesNotification = DefaultUnreadMessagesNotification,
  } = useComponentContext();
  const messagePaginator = useMessagePaginator();

  const { hasMoreNewer, isLoading, messages } = useStateStore(
    messagePaginator.state,
    messagePaginatorStateSelector,
  );

  const channelUnreadUiState = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );
  const { messageFocusSignal } = useStateStore(
    messagePaginator.messageFocusSignal,
    messageFocusSignalSelector,
  );
  const focusedMessageId = messageFocusSignal?.messageId;

  const {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  } = useScrollLocationLogic({
    hasMoreNewer,
    listElement,
    loadMoreScrollThreshold,
    messages, // todo: is it correct to base the scroll logic on an array that does not contain date separators or intro?
    scrolledUpThreshold: props.scrolledUpThreshold,
    suppressAutoscroll,
  });

  const { show: showUnreadMessagesNotification } = useUnreadMessagesNotification({
    isMessageListScrolledToBottom,
    listElement,
    showAlways: !!showUnreadNotificationAlways,
  });

  useMarkRead({
    hasMoreNewer,
    isMessageListScrolledToBottom,
    messageListIsThread: isThreadList,
  });

  const notificationTarget = useNotificationTarget();

  useIncomingMessageAnnouncements({
    activeThreadId: thread?.id,
    channel,
    ownUserId: channel.getClient().user?.id,
    threadList: isThreadList,
  });

  // MERGE-RECONCILE: master's useReducedMotionPreference()/scrollBehavior was NOT
  // re-grafted here — it fed master's scroll logic, which PR #2909 replaced with
  // messagePaginator-driven scrolling (useScrollLocationLogic). Reconcile if
  // prefers-reduced-motion scroll behavior is required.

  const { messageGroupStyles, messages: enrichedMessages } = useEnrichedMessages({
    channel,
    disableDateSeparator,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    reviewProcessedMessage,
  });

  const lastOwnMessage = useLastOwnMessage({
    messages,
    ownUserId: channel.getClient().user?.id,
  });

  const elements = useMessageListElements({
    enrichedMessages,
    focusedMessageId,
    internalMessageProps: {
      // MERGE-RECONCILE: additionalMessageInputProps → additionalMessageComposerProps
      // (master's MessageInput→MessageComposer rename). Per-action get*Notification props
      // were removed by master's notification redesign and are no longer drilled here.
      additionalMessageComposerProps: props.additionalMessageComposerProps,
      closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
      disableQuotedMessages: props.disableQuotedMessages,
      formatDate: props.formatDate,
      messageActions,
      messageListRect: wrapperRect,
      onMentionsClick: props.onMentionsClick,
      onMentionsHover: props.onMentionsHover,
      onUserClick: props.onUserClick,
      onUserHover: props.onUserHover,
      reactionDetailsSort,
      renderText: props.renderText,
      // retrySendMessage: props.retrySendMessage,
      showAvatar: props.showAvatar,
      sortReactions,
      unsafeHTML,
    },
    lastOwnMessage,
    messageGroupStyles,
    messages,
    renderMessages,
    returnAllReadData,
  });

  const messageListClass = customClasses?.messageList || 'str-chat__message-list';

  const loadOlderMessages = React.useCallback(async () => {
    if (loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setSuppressAutoscrollWhileLoadingOlder(true);
    try {
      await messagePaginator.toTail();
    } finally {
      loadingOlderRef.current = false;
      setSuppressAutoscrollWhileLoadingOlder(false);
    }
  }, [messagePaginator]);

  const scrollToBottomFromNotification = React.useCallback(() => {
    if (messagePaginator.hasMoreHead) {
      // Latest page not loaded — load it; the message-focus signal then drives the smooth scroll
      // to the latest message via the effect below.
      messagePaginator.jumpToTheLatestMessage();
    } else {
      scrollToBottom({ behavior: getScrollBehavior() });
    }
  }, [messagePaginator, scrollToBottom]);

  // Bring a focused message (deep-link / quoted-reply jump, or jump-to-latest) into view and start
  // its highlight's dismissal only once it is actually viewed.
  //
  // The list renders whatever the paginator holds in state, so the target is in the DOM as soon as
  // the jump resolves — there is nothing to wait for on the data side. What can lag is *visibility*:
  // the list may be collapsed to zero width (e.g. a thread panel covering the channel when a "view
  // in channel" jump fires), in which case the initial scroll is computed against stale geometry and
  // the emit-time TTL would burn the highlight before the user ever sees it. So we:
  //   - re-center on relayout (the reveal resizes the list 0 → full width; a resize is the precise
  //     signal for "geometry changed" and never fires from scrolling, so it can't fight the smooth
  //     animation below), and
  //   - measure the dismissal TTL from the moment the message is genuinely on screen (viewed),
  //     reported by an IntersectionObserver rather than from when the jump resolved.
  React.useLayoutEffect(() => {
    if (!messageFocusSignal || !listElement) return;
    const { messageId, token } = messageFocusSignal;

    const findTarget = () =>
      listElement.querySelector<HTMLElement>(`[data-message-id='${messageId}']`);
    const centerTarget = (behavior: ScrollBehavior) =>
      findTarget()?.scrollIntoView({ behavior, block: 'center' });

    // Initial attempt — smooth (or reduced-motion 'auto') for the common case of a visible list.
    centerTarget(getScrollBehavior());

    const target = findTarget();
    if (
      !target ||
      typeof IntersectionObserver === 'undefined' ||
      typeof ResizeObserver === 'undefined'
    ) {
      // Can't observe "viewed" — start the countdown now so the highlight still clears.
      messagePaginator.scheduleMessageFocusSignalClear({ token });
      return;
    }

    // Re-center on relayout while the jump is active, keyed off an actual change in the list's
    // measured size rather than "the observer's Nth callback". That distinction matters: the reveal
    // (0 → full width) often coincides with the observer's initial callback, so a "skip the first
    // callback" heuristic would swallow the very resize we need to react to. Comparing sizes also
    // leaves the common visible-list case untouched — the baseline callback reports no change, so
    // the initial smooth scroll above is never interrupted by an instant re-center.
    let lastWidth = listElement.clientWidth;
    let lastHeight = listElement.clientHeight;
    const relayoutObserver = new ResizeObserver(() => {
      const width = listElement.clientWidth;
      const height = listElement.clientHeight;
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      centerTarget('auto');
    });

    const viewObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        const rootHeight = listElement.clientHeight || 1;
        // Viewed = at least half the message is on screen, or (for a message taller than the
        // viewport) the visible slice fills at least half the viewport.
        const viewed =
          entry.isIntersecting &&
          (entry.intersectionRatio >= 0.5 ||
            entry.intersectionRect.height >= rootHeight * 0.5);
        if (!viewed) return;
        messagePaginator.scheduleMessageFocusSignalClear({ token });
        viewObserver.disconnect();
        relayoutObserver.disconnect();
      },
      { root: listElement, threshold: [0, 0.5, 1] },
    );

    viewObserver.observe(target);
    relayoutObserver.observe(listElement);

    return () => {
      viewObserver.disconnect();
      relayoutObserver.disconnect();
    };
  }, [messageFocusSignal, listElement, messagePaginator]);

  const id = useStableId();

  const showEmptyStateIndicator = elements.length === 0 && !isThreadList;
  const dialogManagerId = isThreadList
    ? `message-list-dialog-manager-thread-${id}`
    : `message-list-dialog-manager-${id}`;

  return (
    <MessageListContextProvider
      value={{
        listElement,
        processedMessages: enrichedMessages,
        scrollToBottom,
      }}
    >
      <MessageTranslationViewProvider>
        <MessageListMainPanel>
          <DialogManagerProvider id={dialogManagerId}>
            {!isThreadList && showUnreadMessagesNotification && (
              <UnreadMessagesNotification
                unreadCount={channelUnreadUiState?.unreadCount}
              />
            )}
            {/*todo: apply styles
            .str-chat__list {
              overflow-y: hidden;
            }

            .str-chat__infinite-scroll-paginator.str-chat__message-list-scroll {
              height: 100%;
            }
            */}
            <FloatingDateSeparator
              disableDateSeparator={disableDateSeparator}
              listElement={listElement}
              processedMessages={enrichedMessages}
            />
            <div
              className={clsx(messageListClass, customClasses?.threadList)}
              onScroll={onScroll}
              ref={setListElement}
              tabIndex={0}
            >
              {showEmptyStateIndicator ? (
                <EmptyStateIndicator listType={isThreadList ? 'thread' : 'message'} />
              ) : (
                <InfiniteScrollPaginator
                  className='str-chat__message-list-scroll'
                  data-testid='reverse-infinite-scroll'
                  element={internalListElement}
                  loadNextOnScrollToBottom={messagePaginator.toHead}
                  loadNextOnScrollToTop={loadOlderMessages}
                  onScroll={onScroll}
                  ref={setListElement}
                  threshold={loadMoreScrollThreshold}
                  {...restInternalInfiniteScrollProps}
                >
                  {props.head}
                  {isLoading && (
                    <div className='str-chat__list__loading' key='loading-indicator'>
                      {props.loadingMore && <LoadingIndicator />}
                    </div>
                  )}
                  <MessageListWrapper className='str-chat__ul'>
                    {elements}
                  </MessageListWrapper>
                  <TypingIndicator
                    isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                    scrollToBottom={scrollToBottom}
                  />

                  <div key='bottom' />
                </InfiniteScrollPaginator>
              )}
              <NewMessageNotification
                newMessageCount={channelUnreadUiState?.unreadCount}
                showNotification={
                  (hasNewMessages || hasMoreNewer) && !isMessageListScrolledToBottom
                }
              />
              {/* An empty list has nothing to jump to — see the matching gate in
                  VirtualizedMessageList. */}
              {messages.length > 0 && (
                <ScrollToLatestMessageButton
                  isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                  isNotAtLatestMessageSet={hasMoreNewer && messages.length > 0}
                  onClick={scrollToBottomFromNotification}
                />
              )}
            </div>
          </DialogManagerProvider>
          <NotificationList panel={notificationTarget} />
        </MessageListMainPanel>
      </MessageTranslationViewProvider>
    </MessageListContextProvider>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageComposerProps'
  | 'closeReactionSelectorOnClick'
  | 'disableQuotedMessages'
  | 'formatDate'
  | 'messageActions'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'reactionDetailsSort'
  | 'renderText'
  // | 'retrySendMessage'
  | 'showAvatar'
  | 'sortReactions'
  | 'unsafeHTML';

// Allow intrinsic element override while keeping div-prop compatibility
type InternalPaginatorProps = Partial<
  Omit<InfiniteScrollPaginatorProps<'div'>, 'element'>
> & {
  element?: keyof React.JSX.IntrinsicElements;
};

export type MessageListProps = Partial<Pick<MessageProps, PropsDrilledToMessage>> & {
  // todo: data manipulation - should live in the paginator
  /** Disables the injection of date separator components in MessageList, defaults to `false` */
  disableDateSeparator?: boolean;
  /** Callback function to set group styles for each message */
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  /** Whether the list has more items to load */
  hasMore?: boolean;
  /** Element to be rendered at the top of the thread message list. By default, these are the Message and ThreadStart components */
  head?: React.ReactElement;
  /**
   * Position to render HeaderComponent, as a timestamp in the same unit as `message.created_at` —
   * i.e. unix nanoseconds. Was milliseconds while `created_at` was a `Date`.
   */
  headerPosition?: number;
  // todo: data manipulation - should live in MessagePaginator
  /** Hides the MessageDeleted components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  // todo: data manipulation - should live in MessagePaginator
  /** Hides the DateSeparator component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** Overrides the default props passed to [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx) */
  internalInfiniteScrollProps?: InternalPaginatorProps;
  /** Function called when latest messages should be loaded, after the list has jumped at an earlier message set */
  jumpToLatestMessage?: () => Promise<void>;
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Whether or not the list is currently loading newer items */
  loadingMoreNewer?: boolean;
  /** Function called when more messages are to be loaded. */
  // loadMore?: () => Promise<void>;
  /** Function called when newer messages are to be loaded. */
  // loadMoreNewer?: () => Promise<void>;
  /** Maximum time in milliseconds that should occur between messages to still consider them grouped together */
  maxTimeBetweenGroupedMessages?: number;
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** The messages to render in the list; defaults to the active message-paginator items. */
  messages?: LocalMessage[];
  /** If true, turns off message UI grouping by user */
  noGroupByUser?: boolean;
  /** Overrides the way MessageList renders messages */
  renderMessages?: MessageRenderer;
  /** If true, `readBy` data supplied to the `Message` components will include all user read states per sent message */
  returnAllReadData?: boolean;
  /**
   * Allows to review changes introduced to messages array on per message basis (e.g. date separator injection before a message).
   * The array returned from the function is appended to the array of messages that are later rendered into React elements in the `MessageList`.
   */
  // todo: have state.pipe() API to allow modifying the state output / emission
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
  /**
   * The pixel threshold under which the message list is considered to be so near to the bottom,
   * so that if a new message is delivered, the list will be scrolled to the absolute bottom.
   * Defaults to 200px
   */
  scrolledUpThreshold?: number;
  /**
   * The floating notification informing about unread messages will be shown when the
   * UnreadMessagesSeparator is not visible. The default is false, that means the notification
   * is shown only when viewing unread messages.
   */
  showUnreadNotificationAlways?: boolean;
  /** If true, prevents autoscroll-to-bottom behavior on new messages. */
  suppressAutoscroll?: boolean;
};

/**
 * The MessageList component renders a list of Messages.
 * It is a consumer of the following contexts:
 * - `ChannelInstanceContext`
 * - `ChatContext`
 * - `ComponentContext`
 * - `ThreadContext`
 */
export const MessageList = (props: MessageListProps) => (
  <MessageListWithContext {...props} />
);
