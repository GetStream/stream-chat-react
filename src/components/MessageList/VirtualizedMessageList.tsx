import type { RefObject } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { FloatingDateSeparator } from './FloatingDateSeparator';
import type {
  ComputeItemKey,
  ScrollSeekConfiguration,
  ScrollSeekPlaceholderProps,
  VirtuosoHandle,
  VirtuosoProps,
} from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';

import { GiphyPreviewMessage as DefaultGiphyPreviewMessage } from './GiphyPreviewMessage';
import { useLastReadData } from './hooks';
import {
  useGiphyPreview,
  useMessageSetKey,
  useNewMessageNotification,
  usePrependedMessagesCount,
  useScrollToBottomOnNewMessage,
  useShouldForceScrollToBottom,
  useUnreadMessagesNotificationVirtualized,
} from './hooks/VirtualizedMessageList';
import { useMarkRead } from './hooks/useMarkRead';
import { useScrollerViewport } from './hooks/VirtualizedMessageList/useScrollerViewport';

import {
  NotificationList as DefaultNotificationList,
  useNotificationTarget,
} from '../Notifications';
import { useIncomingMessageAnnouncements } from '../Accessibility';
import { NewMessageNotification as DefaultNewMessageNotification } from './NewMessageNotification';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';
import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from './utils';
import { getGroupStyles, getLastReceived, processMessages } from './utils';
import type { MessageProps } from '../Message';
import { UnreadMessagesNotification as DefaultUnreadMessagesNotification } from './UnreadMessagesNotification';
import {
  calculateFirstItemIndex,
  calculateItemIndex,
  EmptyPlaceholder,
  Header,
  Item,
  makeItemsRenderedHandler,
  messageRenderer,
} from './VirtualizedMessageListComponents';

import {
  UnreadMessagesSeparator as DefaultUnreadMessagesSeparator,
  ScrollToLatestMessageButton,
} from '../MessageList';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';

import { DialogManagerProvider, useChannel, WithComponents } from '../../context';
import type { ChatContextValue } from '../../context/ChatContext';
import { useChatContext } from '../../context/ChatContext';
import type { ComponentContextValue } from '../../context/ComponentContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageTranslationViewProvider } from '../../context/MessageTranslationViewContext';
import { VirtualizedMessageListContextProvider } from '../../context/VirtualizedMessageListContext';
import { getMessageSourceKey } from './messageSourceKey';
import { useStateStore } from '../../store';
import { useThreadContext } from '../Threads';
import { useThreadHead } from './hooks/useThreadHead';
import { useMessagePaginator } from '../../hooks';

import type {
  Channel,
  LocalMessage,
  MessageFocusSignalState,
  MessagePaginatorState,
  ChannelState as StreamChannelState,
  TimestampNS,
  UnreadSnapshotState,
  UserResponse,
} from 'stream-chat';
import type { UnknownType } from '../../types/types';
import { useCanPaginateReplies } from './hooks/useCanPaginateReplies';
import { useStableId } from '../UtilityComponents/useStableId';
import { useLastDeliveredData } from './hooks/useLastDeliveredData';
import { useLastOwnMessage } from './hooks/useLastOwnMessage';

type PropsDrilledToMessage =
  | 'additionalMessageComposerProps'
  | 'formatDate'
  | 'reactionDetailsSort'
  | 'renderText'
  | 'showAvatar'
  | 'sortReactions';

type VirtualizedMessageListPropsForContext =
  | PropsDrilledToMessage
  | 'closeReactionSelectorOnClick'
  | 'customMessageRenderer'
  // | 'loadingMore'
  | 'returnAllReadData'
  | 'shouldGroupByUser';

/** Virtuoso `context`, handed to the components and callbacks that Virtuoso invokes. */
export type VirtuosoContext = Required<
  Pick<
    ComponentContextValue,
    'DateSeparator' | 'MessageSystem' | 'UnreadMessagesSeparator'
  >
> &
  Pick<VirtualizedMessageListProps, VirtualizedMessageListPropsForContext> &
  Pick<ChatContextValue, 'customClasses'> & {
    channel: Channel;
    /** The thread parent message rendered above the replies, or null outside a thread. */
    head: React.ReactElement | null;
    lastReceivedMessageId: string | null | undefined;
    loadingMore: boolean;
    /** Maps a message ID to its position in a group of consecutive messages from one user. */
    messageGroupStyles: Record<string, GroupStyle>;
    /** Number of messages prepended to the first page, used to compute virtual indexes. */
    numItemsPrepended: number;
    /** Maps the ID of each own message to the users it was delivered to. */
    ownMessagesDeliveredToOthers: Record<string, UserResponse[]>;
    /** Maps the ID of each own message to the users who read it. */
    ownMessagesReadByOthers: Record<string, UserResponse[]>;
    /**
     * The messages with date separators inserted and, when configured, deleted messages and the
     * giphy preview left out.
     */
    processedMessages: RenderedMessage[];
    virtuosoRef: RefObject<VirtuosoHandle | null>;
    lastOwnMessage?: LocalMessage;
    firstUnreadMessageId: string | null;
    /** Unix nanoseconds, as `messagePaginator.unreadStateSnapshot.lastReadAt` carries it. */
    lastReadDate: TimestampNS | null;
    lastReadMessageId: string | null;
    unreadMessageCount: number;
    /** ID of the message targeted by the paginator's focus signal. */
    focusedMessageId?: string | null;
  };

type VirtualizedMessageListWithContextProps = VirtualizedMessageListProps & {
  channel: Channel;
  read?: StreamChannelState['read'];
};

const channelReadSelector = (nextValue: { read: StreamChannelState['read'] }) => ({
  read: nextValue.read,
});

function captureResizeObserverExceededError(e: ErrorEvent) {
  if (
    e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    e.message === 'ResizeObserver loop limit exceeded'
  ) {
    e.stopImmediatePropagation();
  }
}

function useCaptureResizeObserverExceededError() {
  useEffect(() => {
    window.addEventListener('error', captureResizeObserverExceededError);
    return () => {
      window.removeEventListener('error', captureResizeObserverExceededError);
    };
  }, []);
}

function fractionalItemSize(element: HTMLElement) {
  return element.getBoundingClientRect().height;
}

function findMessageIndex(messages: RenderedMessage[], id: string) {
  return messages.findIndex((message) => message.id === id);
}

function calculateInitialTopMostItemIndex(
  messages: RenderedMessage[],
  focusedMessageId: string | undefined,
) {
  if (focusedMessageId) {
    const index = findMessageIndex(messages, focusedMessageId);
    if (index !== -1) {
      return { align: 'center', index } as const;
    }
  }
  // A bare index aligns the row's top to the viewport top, which leaves a last message taller than
  // the list hanging below the fold. Anchoring its end opens the list at the true bottom.
  return { align: 'end', index: messages.length - 1 } as const;
}

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => state;
const messageFocusSignalSelector = (state: MessageFocusSignalState) => ({
  messageFocusSignal: state.signal,
});

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  hasMoreNewer: state.hasMoreHead,
  isLoading: state.isLoading,
  messages: state.items ?? [],
});

const VirtualizedMessageListWithContext = (
  props: VirtualizedMessageListWithContextProps,
) => {
  const {
    additionalMessageComposerProps,
    additionalVirtuosoProps = {},
    channel,
    closeReactionSelectorOnClick,
    customMessageRenderer,
    defaultItemHeight,
    formatDate,
    groupStyles,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    maxTimeBetweenGroupedMessages,
    overscan = 0,
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    reactionDetailsSort,
    renderText,
    returnAllReadData = false,
    reviewProcessedMessage,
    scrollSeekPlaceHolder,
    scrollToLatestMessageOnFocus = false,
    separateGiphyPreview = false,
    shouldGroupByUser = false,
    showAvatar,
    showUnreadNotificationAlways,
    sortReactions,
    stickToBottomScrollBehavior = 'smooth',
    suppressAutoscroll: suppressAutoscrollFromProps = false,
    withDateSeparator = false,
  } = props;
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const threadHead = useThreadHead();
  const [suppressAutoscrollWhileLoadingOlder, setSuppressAutoscrollWhileLoadingOlder] =
    React.useState(false);
  const suppressAutoscroll =
    suppressAutoscrollFromProps || suppressAutoscrollWhileLoadingOlder;
  const loadingOlderRef = useRef(false);

  const { components: virtuosoComponentsFromProps, ...overridingVirtuosoProps } =
    additionalVirtuosoProps;

  // Keeps react-virtuoso's ResizeObserver loop errors from reaching Sentry or other trackers.
  useCaptureResizeObserverExceededError();

  const {
    DateSeparator = DefaultDateSeparator,
    GiphyPreviewMessage = DefaultGiphyPreviewMessage,
    MessageSystem = DefaultMessageSystem,
    NewMessageNotification = DefaultNewMessageNotification,
    TypingIndicator,
    UnreadMessagesNotification = DefaultUnreadMessagesNotification,
    UnreadMessagesSeparator = DefaultUnreadMessagesSeparator,
    VirtualMessage,
  } = useComponentContext();
  // `VirtualMessage` overrides `MessageUI` through this subtree's `ComponentContext`. Memoized so
  // consumers below do not get a new value each render.
  const virtualMessageOverrides = useMemo(
    () => ({ MessageUI: VirtualMessage }),
    [VirtualMessage],
  );

  const { client, customClasses } = useChatContext();
  const messagePaginator = useMessagePaginator();

  const { hasMoreNewer, isLoading, messages } = useStateStore(
    messagePaginator.state,
    messagePaginatorStateSelector,
  );
  const { messageFocusSignal } = useStateStore(
    messagePaginator.messageFocusSignal,
    messageFocusSignalSelector,
  );

  const channelUnreadUiState = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );
  const focusedMessageId = messageFocusSignal?.messageId;

  const virtuoso = useRef<VirtuosoHandle>(null);

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const { show: showUnreadMessagesNotification, toggleShowUnreadMessagesNotification } =
    useUnreadMessagesNotificationVirtualized({
      showAlways: !!showUnreadNotificationAlways,
    });

  const { giphyPreviewMessage, setGiphyPreviewMessage } =
    useGiphyPreview(separateGiphyPreview);

  const processedMessages = useMemo(() => {
    if (typeof messages === 'undefined') {
      return [];
    }

    if (
      !withDateSeparator &&
      !hideDeletedMessages &&
      hideNewMessageSeparator &&
      !separateGiphyPreview
    ) {
      return messages;
    }

    return processMessages({
      hideDeletedMessages,
      hideNewMessageSeparator,
      lastRead,
      messages,
      reviewProcessedMessage,
      setGiphyPreviewMessage,
      userId: client.userID || '',
      withDateSeparator,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    withDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    messages,
    messages?.length,
    client.userID,
  ]);

  // Virtuoso's `itemsRendered` is set at render time, while `FloatingDateSeparator` is a child that
  // owns the actual handler and assigns it to this ref.
  const floatingDateItemsRenderedRef = useRef<
    ((rendered: RenderedMessage[]) => void) | null
  >(null);

  const lastOwnMessage = useLastOwnMessage({ messages, ownUserId: client.user?.id });

  const ownMessagesReadByOthers = useLastReadData({
    channel,
    lastOwnMessage,
    messages: messages || [],
    returnAllReadData,
  });

  const ownMessagesDeliveredToOthers = useLastDeliveredData({
    channel,
    lastOwnMessage,
    messages: messages || [],
    returnAllReadData,
  });

  const lastReceivedMessageId = useMemo(
    () => getLastReceived(processedMessages),
    [processedMessages],
  );

  const groupStylesFn = groupStyles || getGroupStyles;
  const messageGroupStyles = useMemo(
    () =>
      processedMessages.reduce<Record<string, GroupStyle>>((acc, message, i) => {
        const style = groupStylesFn(
          message,
          processedMessages[i - 1],
          processedMessages[i + 1],
          !shouldGroupByUser,
          maxTimeBetweenGroupedMessages,
        );
        if (style && message.id) acc[message.id] = style;
        return acc;
      }, {}),
    // `processedMessages` can be rebuilt with a new identity, hence the `.length` dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      maxTimeBetweenGroupedMessages,
      processedMessages.length,
      shouldGroupByUser,
      groupStylesFn,
    ],
  );

  const {
    atBottom,
    isMessageListScrolledToBottom,
    newMessagesNotification,
    setIsMessageListScrolledToBottom,
    setNewMessagesNotification,
  } = useNewMessageNotification(processedMessages, client.userID);

  const { handleScrollerRef, isAtTrueBottom, remeasure, threshold } =
    useScrollerViewport();

  // `scrollerRef` and `totalListHeightChanged` are composed with the integrator's and applied after
  // the `additionalVirtuosoProps` spread, so an override cannot switch the measurement off.
  const {
    customScrollParent,
    scrollerRef: scrollerRefFromProps,
    totalListHeightChanged: totalListHeightChangedFromProps,
    useWindowScroll,
  } = overridingVirtuosoProps;

  // Virtuoso's window-scroll path never calls the supplied `scrollerRef` (it passes its own no-op),
  // so in these two modes the hook must be told what to measure. Otherwise the thresholds stay at
  // their full-height defaults and the true-bottom check always answers "yes".
  useEffect(() => {
    if (!useWindowScroll && !customScrollParent) return;
    handleScrollerRef(customScrollParent ?? window);
  }, [customScrollParent, handleScrollerRef, useWindowScroll]);

  const scrollerRef = useCallback(
    (element: HTMLElement | Window | null) => {
      handleScrollerRef(element);
      scrollerRefFromProps?.(element);
    },
    [handleScrollerRef, scrollerRefFromProps],
  );

  // Content can grow without the scroller resizing or scrolling (e.g. an avatar or image loading
  // late), which moves the true bottom without firing either event the hook observes.
  const totalListHeightChanged = useCallback(
    (height: number) => {
      remeasure();
      totalListHeightChangedFromProps?.(height);
    },
    [remeasure, totalListHeightChangedFromProps],
  );

  useMarkRead({
    hasMoreNewer,
    // Virtuoso's at-bottom flag has a threshold, so on a short list it reads true while part of the
    // last message is still clipped. Marking a channel read needs the stricter signal.
    isAtTrueBottom,
    isMessageListScrolledToBottom,
    messageListIsThread: isThreadList,
  });

  useIncomingMessageAnnouncements({
    activeThreadId: thread?.id,
    channel,
    ownUserId: channel.getClient().user?.id,
    threadList: isThreadList,
  });

  const scrollToBottom = useCallback(async () => {
    if (messagePaginator.hasMoreHead) {
      await messagePaginator.jumpToTheLatestMessage();
    } else if (virtuoso.current) {
      // Without `align: 'end'` a last message taller than the viewport lands with its bottom
      // clipped.
      virtuoso.current.scrollToIndex({
        align: 'end',
        index: processedMessages.length - 1,
      });
    }

    setNewMessagesNotification(false);
  }, [
    messagePaginator,
    virtuoso,
    processedMessages,
    setNewMessagesNotification,
    // `processedMessages` can be rebuilt with a new identity, hence the `.length` dependency.
    // processedMessages.length,
  ]);

  useScrollToBottomOnNewMessage({
    messages,
    scrollToBottom,
    scrollToLatestMessageOnFocus,
  });

  const numItemsPrepended = usePrependedMessagesCount(
    processedMessages,
    withDateSeparator,
  );

  const { messageSetKey } = useMessageSetKey({ messages });

  const shouldForceScrollToBottom = useShouldForceScrollToBottom(
    processedMessages,
    client.userID,
  );

  const handleItemsRendered = useMemo(
    () =>
      makeItemsRenderedHandler(
        [
          toggleShowUnreadMessagesNotification,
          (rendered) => floatingDateItemsRenderedRef.current?.(rendered),
        ],
        processedMessages,
      ),
    [processedMessages, toggleShowUnreadMessagesNotification],
  );
  const followOutput = (isAtBottom: boolean) => {
    if (messagePaginator.hasMoreHead || suppressAutoscroll) {
      return false;
    }

    if (shouldForceScrollToBottom()) {
      return isAtBottom ? stickToBottomScrollBehavior : 'auto';
    }
    // A message from another user arrived: only follow when already at the bottom.
    return isAtBottom ? stickToBottomScrollBehavior : false;
  };

  const computeItemKey = useCallback<ComputeItemKey<UnknownType, VirtuosoContext>>(
    (index, _, { numItemsPrepended, processedMessages }) =>
      processedMessages[calculateItemIndex(index, numItemsPrepended)].id,
    [],
  );

  const canPaginateReplies = useCanPaginateReplies();

  const atBottomStateChange = (isAtBottom: boolean) => {
    atBottom.current = isAtBottom;
    setIsMessageListScrolledToBottom(isAtBottom);

    if (isAtBottom) {
      // An empty thread is at both ends at once, so Virtuoso reports both on mount;
      // `canPaginateReplies` keeps that from becoming a request.
      if (canPaginateReplies) messagePaginator.toHead();
      setNewMessagesNotification?.(false);
    }
  };
  const atTopStateChange = (isAtTop: boolean) => {
    if (isAtTop) {
      if (!canPaginateReplies) return;
      if (loadingOlderRef.current) return;
      loadingOlderRef.current = true;
      setSuppressAutoscrollWhileLoadingOlder(true);
      void messagePaginator.toTail().finally(() => {
        loadingOlderRef.current = false;
        setSuppressAutoscrollWhileLoadingOlder(false);
      });
    }
  };

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    if (focusedMessageId) {
      const index = findMessageIndex(processedMessages, focusedMessageId);
      if (index !== -1) {
        scrollTimeout = setTimeout(() => {
          virtuoso.current?.scrollToIndex({ align: 'center', index });
        }, 0);
      }
    }
    return () => {
      clearTimeout(scrollTimeout);
    };
  }, [focusedMessageId, processedMessages]);

  const id = useStableId();

  const dialogManagerId = isThreadList
    ? `virtualized-message-list-dialog-manager-thread-${id}`
    : `virtualized-message-list-dialog-manager-${id}`;

  const list = (
    <VirtualizedMessageListContextProvider value={{ scrollToBottom }}>
      <MessageTranslationViewProvider>
        <DialogManagerProvider id={dialogManagerId}>
          {!isThreadList && showUnreadMessagesNotification && (
            <UnreadMessagesNotification unreadCount={channelUnreadUiState?.unreadCount} />
          )}
          <div
            className={customClasses?.virtualizedMessageList || 'str-chat__virtual-list'}
          >
            <FloatingDateSeparator
              itemsRenderedRef={floatingDateItemsRenderedRef}
              processedMessages={processedMessages}
              withDateSeparator={withDateSeparator}
            />
            <Virtuoso<UnknownType, VirtuosoContext>
              atBottomStateChange={atBottomStateChange}
              atBottomThreshold={threshold}
              atTopStateChange={atTopStateChange}
              atTopThreshold={threshold}
              className='str-chat__message-list-scroll'
              components={{
                EmptyPlaceholder,
                Header,
                Item,
                ...virtuosoComponentsFromProps,
              }}
              computeItemKey={computeItemKey}
              context={{
                additionalMessageComposerProps,
                channel,
                closeReactionSelectorOnClick,
                customClasses,
                customMessageRenderer,
                DateSeparator,
                firstUnreadMessageId: channelUnreadUiState?.firstUnreadMessageId,
                focusedMessageId,
                formatDate,
                head: threadHead,
                lastOwnMessage,
                lastReadDate: channelUnreadUiState?.lastReadAt,
                lastReadMessageId: channelUnreadUiState?.lastReadMessageId,
                lastReceivedMessageId,
                loadingMore: isLoading,
                messageGroupStyles,
                MessageSystem,
                numItemsPrepended,
                ownMessagesDeliveredToOthers,
                ownMessagesReadByOthers,
                processedMessages,
                reactionDetailsSort,
                renderText,
                returnAllReadData,
                shouldGroupByUser,
                showAvatar,
                sortReactions,
                unreadMessageCount: channelUnreadUiState?.unreadCount,
                UnreadMessagesSeparator,
                virtuosoRef: virtuoso,
              }}
              firstItemIndex={calculateFirstItemIndex(numItemsPrepended)}
              followOutput={followOutput}
              increaseViewportBy={{ bottom: 200, top: 0 }}
              initialTopMostItemIndex={calculateInitialTopMostItemIndex(
                processedMessages,
                focusedMessageId,
              )}
              itemContent={messageRenderer}
              itemSize={fractionalItemSize}
              itemsRendered={handleItemsRendered}
              key={messageSetKey}
              overscan={overscan}
              ref={virtuoso}
              style={{ overflowX: 'hidden' }}
              totalCount={processedMessages.length}
              {...overridingVirtuosoProps}
              scrollerRef={scrollerRef}
              totalListHeightChanged={totalListHeightChanged}
              {...(scrollSeekPlaceHolder ? { scrollSeek: scrollSeekPlaceHolder } : {})}
              {...(defaultItemHeight ? { defaultItemHeight } : {})}
            />
            {/* Only for messages that arrived while the reader was scrolled up. Reading an older
                  window (e.g. after a jump) is signalled by ScrollToLatestMessageButton instead. */}
            <NewMessageNotification
              newMessageCount={channelUnreadUiState?.unreadCount}
              showNotification={newMessagesNotification && !isMessageListScrolledToBottom}
            />
            {/* An empty list has nothing to jump to but can report "not at bottom". */}
            {messages.length > 0 && (
              <ScrollToLatestMessageButton
                isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                isNotAtLatestMessageSet={hasMoreNewer && messages.length > 0}
                onClick={scrollToBottom}
              />
            )}
          </div>
        </DialogManagerProvider>
        {TypingIndicator && (
          <TypingIndicator
            isMessageListScrolledToBottom={isMessageListScrolledToBottom}
            scrollToBottom={scrollToBottom}
          />
        )}
        {giphyPreviewMessage && <GiphyPreviewMessage message={giphyPreviewMessage} />}
      </MessageTranslationViewProvider>
    </VirtualizedMessageListContextProvider>
  );

  // Only wrap when there is something to override, so the common case adds no provider.
  return VirtualMessage ? (
    <WithComponents overrides={virtualMessageOverrides}>{list}</WithComponents>
  ) : (
    list
  );
};

export type VirtualizedMessageListProps = Partial<
  Pick<MessageProps, PropsDrilledToMessage>
> & {
  /** Props passed to the underlying [`react-virtuoso`](https://virtuoso.dev/virtuoso-api-reference/). */
  additionalVirtuosoProps?: VirtuosoProps<UnknownType, VirtuosoContext>;
  /** Closes the reaction selector after a reaction is picked. */
  closeReactionSelectorOnClick?: boolean;
  /** Replaces the default item renderer, so the props that renderer reads are ignored. */
  customMessageRenderer?: (
    messageList: RenderedMessage[],
    index: number,
  ) => React.ReactElement;
  /**
   * Item height used to compute the total list height; useful when message heights vary a lot.
   *
   * @deprecated Use additionalVirtuosoProps.defaultItemHeight instead. Will be removed with next major release - `v11.0.0`.
   */
  defaultItemHeight?: number;
  /** Computes the group style of a message from its neighbors. */
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  /** Hides deleted messages from the list. Defaults to `false`. */
  hideDeletedMessages?: boolean;
  /** Hides the date separator before the first unread incoming message. Defaults to `false`. */
  hideNewMessageSeparator?: boolean;
  /** Maximum time (ms) between two messages for them to stay in the same group. */
  maxTimeBetweenGroupedMessages?: number;
  /**
   * Extra content rendered in addition to what fills the viewport.
   *
   * @deprecated Use additionalVirtuosoProps.overscan instead. Will be removed with next major release - `v11.0.0`.
   */
  overscan?: number;
  /** Computes read and delivery data for every own message, not only the last one. */
  returnAllReadData?: boolean;
  /**
   * Reviews the changes made around each message (e.g. a date separator injected before it). The
   * returned array is appended to the rendered messages in place of `changes`.
   */
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
  /**
   * Shows placeholders while the user scrolls fast through the list, e.g.:
   * ```
   *  {
   *    enter: (velocity) => Math.abs(velocity) > 120,
   *    exit: (velocity) => Math.abs(velocity) < 40,
   *    change: () => null,
   *    placeholder: ({index, height})=> <div style={{height: height + "px"}}>{index}</div>,
   *  }
   *  ```
   *
   * @deprecated Pass additionalVirtuosoProps.scrollSeekConfiguration and specify the placeholder in additionalVirtuosoProps.components.ScrollSeekPlaceholder instead.  Will be removed with next major release - `v11.0.0`.
   */
  scrollSeekPlaceHolder?: ScrollSeekConfiguration & {
    placeholder: React.ComponentType<ScrollSeekPlaceholderProps>;
  };
  /**
   * Scrolls to the latest message when the window regains focus, if the messages changed while it
   * was blurred. Defaults to `false`.
   */
  scrollToLatestMessageOnFocus?: boolean;
  /**
   * Renders the Giphy preview as a separate component after the list instead of inline. Defaults
   * to `false`.
   */
  separateGiphyPreview?: boolean;
  /** Groups consecutive messages from the same user. Defaults to `false`. */
  shouldGroupByUser?: boolean;
  /**
   * Shows the unread notification whenever the `UnreadMessagesSeparator` is out of view. Defaults
   * to `false`: it shows only when the separator is scrolled above the viewport.
   */
  showUnreadNotificationAlways?: boolean;
  /**
   * `scrollTo` behavior when new messages arrive while at the bottom: `'smooth'` for regular
   * channels, `'auto'` (instant) for high throughput. Defaults to `'smooth'`.
   */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
  /** Prevents autoscrolling to the bottom on new messages. */
  suppressAutoscroll?: boolean;
  /** Injects date separators into the list. Defaults to `false`. */
  withDateSeparator?: boolean;
};

/** Renders the messages of the active channel or thread in a virtualized list. */
export function VirtualizedMessageList(props: VirtualizedMessageListProps) {
  const channel = useChannel();
  const thread = useThreadContext();
  const notificationTarget = useNotificationTarget();
  const {
    MessageListMainPanel = DefaultMessageListMainPanel,
    NotificationList = DefaultNotificationList,
  } = useComponentContext();

  const { read } = useStateStore(channel?.state, channelReadSelector) ?? {};

  // The panel and the notification list sit outside the keyed list so a notification survives a
  // switch.
  // todo: finalize the props shape for VirtualizedMessageList
  return (
    <MessageListMainPanel>
      <VirtualizedMessageListWithContext
        channel={channel}
        // The list's local state (Virtuoso's scroll offset above all) belongs to one thread or
        // channel and resets on a switch.
        key={getMessageSourceKey({ channel, thread })}
        read={read}
        {...props}
      />
      <NotificationList panel={notificationTarget} />
    </MessageListMainPanel>
  );
}
