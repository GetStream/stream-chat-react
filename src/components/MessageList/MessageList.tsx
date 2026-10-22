import clsx from 'clsx';
import React from 'react';

import {
  useEnrichedMessages,
  useMessageListElements,
  useScrollLocationLogic,
  useUnreadMessagesNotification,
} from './hooks/MessageList';
import { getMessageSourceKey } from './messageSourceKey';
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
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';

import { FloatingDateSeparator } from './FloatingDateSeparator';
import type { MessageRenderer } from './renderMessages';
import { defaultRenderMessages } from './renderMessages';
import { useStableId } from '../UtilityComponents/useStableId';
import { useThreadContext } from '../Threads';
import { useThreadHead } from './hooks/useThreadHead';

import type {
  MessageFocusSignalState,
  MessagePaginatorState,
  TimestampNS,
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
import { useCanPaginateReplies } from './hooks/useCanPaginateReplies';

type MessageListWithContextProps = MessageListProps;

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  hasMoreNewer: state.hasMoreHead,
  isLoading: state.isLoading,
  messages: state.items ?? [],
});

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => state;
const messageFocusSignalSelector = (state: MessageFocusSignalState) => ({
  messageFocusSignal: state.signal,
});

// For user-initiated scrolls (scroll-to-latest, jump-to-message); autoscroll stays instant. Smooth
// unless the OS prefers reduced motion (WCAG 2.3.3, `auto` scrolls instantly). Read at scroll time
// instead of through a reactive hook, which would re-render the list and perturb the paginator's
// scroll-position handling.
const getScrollBehavior = (): ScrollBehavior =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';

const MessageListWithContext = (props: MessageListWithContextProps) => {
  const channel = useChannel();
  const threadHead = useThreadHead();
  const {
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
    noGroupByUser = false,
    reactionDetailsSort,
    renderMessages = defaultRenderMessages,
    returnAllReadData = false,
    reviewProcessedMessage,
    showUnreadNotificationAlways,
    sortReactions,
    suppressAutoscroll: suppressAutoscrollFromProps = false,
    unsafeHTML = false,
    withDateSeparator = true,
  } = props;
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const [isLoadingOlder, setIsLoadingOlder] = React.useState(false);
  const suppressAutoscroll = suppressAutoscrollFromProps || isLoadingOlder;
  const loadingOlderRef = React.useRef(false);

  const [listElement, setListElement] = React.useState<HTMLDivElement | null>(null);

  const { customClasses } = useChatContext();

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListWrapper = 'ul',
    NewMessageNotification = DefaultNewMessageNotification,
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
    focusedMessageId,
    hasMoreNewer,
    listElement,
    loadingMore: isLoading,
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

  useIncomingMessageAnnouncements({
    activeThreadId: thread?.id,
    channel,
    ownUserId: channel.getClient().user?.id,
    threadList: isThreadList,
  });

  const { messageGroupStyles, messages: enrichedMessages } = useEnrichedMessages({
    channel,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    maxTimeBetweenGroupedMessages,
    messages,
    noGroupByUser,
    reviewProcessedMessage,
    withDateSeparator,
  });

  const lastOwnMessage = useLastOwnMessage({
    messages,
    ownUserId: channel.getClient().user?.id,
  });

  const elements = useMessageListElements({
    enrichedMessages,
    focusedMessageId,
    internalMessageProps: {
      additionalMessageComposerProps: props.additionalMessageComposerProps,
      closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
      disableQuotedMessages: props.disableQuotedMessages,
      formatDate: props.formatDate,
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

  // Stops a short thread from paging at both ends as soon as the scroller mounts.
  const canPaginateReplies = useCanPaginateReplies();

  const loadOlderMessages = React.useCallback(async () => {
    // Mirrors the paginator's gate for a tailward page, so `isLoadingOlder` (the older-page
    // indicator) is not raised while another load holds `isLoading` and `toTail()` would not query.
    if (
      loadingOlderRef.current ||
      messagePaginator.isLoading ||
      !messagePaginator.hasMoreTail
    ) {
      return;
    }
    loadingOlderRef.current = true;
    setIsLoadingOlder(true);
    try {
      await messagePaginator.toTail();
    } finally {
      loadingOlderRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [messagePaginator]);

  const scrollToBottomFromNotification = React.useCallback(() => {
    if (messagePaginator.hasMoreHead) {
      // The latest page is not loaded: load it, and the message-focus signal then drives the
      // smooth scroll to the latest message via the effect below.
      messagePaginator.jumpToTheLatestMessage();
    } else {
      scrollToBottom({ behavior: getScrollBehavior() });
    }
  }, [messagePaginator, scrollToBottom]);

  // Scrolls a focused message (deep-link or quoted-reply jump, or jump-to-latest) into view and
  // starts its highlight's dismissal countdown once it has been viewed. The list can be collapsed
  // to zero width when the jump fires (e.g. a thread panel covers the channel), so the initial
  // scroll uses stale geometry and a countdown started at the jump would expire before the user
  // sees the message. Hence the relayout re-center (a resize never fires from scrolling, so it
  // cannot fight the smooth scroll) and the IntersectionObserver below.
  React.useLayoutEffect(() => {
    if (!messageFocusSignal || !listElement) return;
    const { messageId, token } = messageFocusSignal;

    const findTarget = () =>
      listElement.querySelector<HTMLElement>(`[data-message-id='${messageId}']`);
    const centerTarget = (behavior: ScrollBehavior) =>
      findTarget()?.scrollIntoView({ behavior, block: 'center' });

    // Smooth (or `auto` under reduced motion) for the common case of a visible list.
    centerTarget(getScrollBehavior());

    const target = findTarget();
    if (
      !target ||
      typeof IntersectionObserver === 'undefined' ||
      typeof ResizeObserver === 'undefined'
    ) {
      // "Viewed" cannot be observed, so start the countdown now to let the highlight clear.
      messagePaginator.scheduleMessageFocusSignalClear({ token });
      return;
    }

    // Re-center when the measured size changes, not on the observer's Nth callback: the reveal
    // (0 to full width) can coincide with the initial callback, and for a visible list that
    // callback reports no change, so the smooth scroll above is not interrupted.
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
        // Viewed: half the message is visible, or the visible slice fills half the viewport.
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
        <DialogManagerProvider id={dialogManagerId}>
          {!isThreadList && showUnreadMessagesNotification && (
            <UnreadMessagesNotification unreadCount={channelUnreadUiState?.unreadCount} />
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
            listElement={listElement}
            processedMessages={enrichedMessages}
            withDateSeparator={withDateSeparator}
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
                loadNextOnScrollToBottom={
                  canPaginateReplies ? messagePaginator.toHead : undefined
                }
                loadNextOnScrollToTop={canPaginateReplies ? loadOlderMessages : undefined}
                onScroll={onScroll}
                ref={setListElement}
                threshold={loadMoreScrollThreshold}
                {...restInternalInfiniteScrollProps}
              >
                {threadHead}
                {isLoading && (
                  <div className='str-chat__list__loading' key='loading-indicator'>
                    {(props.loadingMore ?? isLoadingOlder) && <LoadingIndicator />}
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
            {/* Only for messages that arrived while the reader was scrolled up. Reading an older
                  window (e.g. after a jump) is signalled by ScrollToLatestMessageButton instead. */}
            <NewMessageNotification
              newMessageCount={channelUnreadUiState?.unreadCount}
              showNotification={hasNewMessages && !isMessageListScrolledToBottom}
            />
            {/* An empty list has nothing to jump to. */}
            {messages.length > 0 && (
              <ScrollToLatestMessageButton
                isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                isNotAtLatestMessageSet={hasMoreNewer && messages.length > 0}
                onClick={scrollToBottomFromNotification}
              />
            )}
          </div>
        </DialogManagerProvider>
      </MessageTranslationViewProvider>
    </MessageListContextProvider>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageComposerProps'
  | 'closeReactionSelectorOnClick'
  | 'disableQuotedMessages'
  | 'formatDate'
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

// Allows any intrinsic element while keeping the div props.
type InternalPaginatorProps = Partial<
  Omit<InfiniteScrollPaginatorProps<'div'>, 'element'>
> & {
  element?: keyof React.JSX.IntrinsicElements;
};

export type MessageListProps = Partial<Pick<MessageProps, PropsDrilledToMessage>> & {
  // todo: data manipulation - should live in the paginator
  /** Computes the group style of a message from its neighbors. */
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  /**
   * Unix-nanosecond timestamp (the unit of `message.created_at`): `HeaderComponent` renders after
   * the last message created before it. Defaults to the top of the list.
   */
  headerPosition?: TimestampNS;
  // todo: data manipulation - should live in MessagePaginator
  /** Hides deleted messages from the list. Defaults to `false`. */
  hideDeletedMessages?: boolean;
  // todo: data manipulation - should live in MessagePaginator
  /** Hides the date separator before the first unread incoming message. Defaults to `false`. */
  hideNewMessageSeparator?: boolean;
  /** Overrides the default props passed to [InfiniteScrollPaginator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator/InfiniteScrollPaginator.tsx) */
  internalInfiniteScrollProps?: InternalPaginatorProps;
  /**
   * Whether to show the `LoadingIndicator` above the messages while the paginator is loading.
   * Defaults to showing it while an older page loads.
   */
  loadingMore?: boolean;
  /** Maximum time (ms) between two messages for them to stay in the same group. */
  maxTimeBetweenGroupedMessages?: number;
  /** Turns off grouping of messages by user. */
  noGroupByUser?: boolean;
  /** Overrides how messages are rendered into list elements. */
  renderMessages?: MessageRenderer;
  /** Computes read and delivery data for every own message, not only the last one. */
  returnAllReadData?: boolean;
  /**
   * Reviews the changes made around each message (e.g. a date separator injected before it). The
   * returned array is appended to the rendered messages in place of `changes`.
   */
  // todo: have state.pipe() API to allow modifying the state output / emission
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
  /**
   * Distance (px) from the bottom within which the list counts as scrolled to the bottom, so a new
   * message scrolls it all the way down. Defaults to 200.
   */
  scrolledUpThreshold?: number;
  /**
   * Shows the unread notification whenever the `UnreadMessagesSeparator` is out of view. Defaults
   * to `false`: it shows only when the separator is scrolled above the viewport.
   */
  showUnreadNotificationAlways?: boolean;
  /** Prevents autoscrolling to the bottom on new messages. */
  suppressAutoscroll?: boolean;
  /** Injects date separators into the list. Defaults to `true`. */
  withDateSeparator?: boolean;
};

/** Renders the messages of the active channel or thread, plus the notification list. */
export const MessageList = (props: MessageListProps) => {
  const channel = useChannel();
  const thread = useThreadContext();
  const notificationTarget = useNotificationTarget();
  const {
    MessageListMainPanel = DefaultMessageListMainPanel,
    NotificationList = DefaultNotificationList,
  } = useComponentContext();

  // The panel and the notification list sit outside the keyed list: the list's state (scroll
  // position, etc.) belongs to one thread or channel and resets on a switch, but a notification's
  // countdown and entry animation have to outlive it.
  return (
    <MessageListMainPanel>
      <MessageListWithContext {...props} key={getMessageSourceKey({ channel, thread })} />
      <NotificationList panel={notificationTarget} />
    </MessageListMainPanel>
  );
};
