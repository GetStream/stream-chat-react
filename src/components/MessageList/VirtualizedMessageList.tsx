import type { RefObject } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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

import { MessageNotification as DefaultMessageNotification } from './MessageNotification';
import { MessageListNotifications as DefaultMessageListNotifications } from './MessageListNotifications';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';
import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from './utils';
import { getGroupStyles, getLastReceived, processMessages } from './utils';
import type { MessageProps, MessageUIComponentProps } from '../Message';
import { MessageSimple } from '../Message';
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

import { UnreadMessagesSeparator as DefaultUnreadMessagesSeparator } from '../MessageList';
import { DateSeparator as DefaultDateSeparator } from '../DateSeparator';
import { EventComponent as DefaultMessageSystem } from '../EventComponent';

import { DialogManagerProvider } from '../../context';
import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import type {
  ChannelNotifications,
  ChannelStateContextValue,
} from '../../context/ChannelStateContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import type { ChatContextValue } from '../../context/ChatContext';
import { useChatContext } from '../../context/ChatContext';
import type { ComponentContextValue } from '../../context/ComponentContext';
import { useComponentContext } from '../../context/ComponentContext';
import { VirtualizedMessageListContextProvider } from '../../context/VirtualizedMessageListContext';

import type {
  Channel,
  LocalMessage,
  ChannelState as StreamChannelState,
  UserResponse,
} from 'stream-chat';
import type { UnknownType } from '../../types/types';
import { DEFAULT_NEXT_CHANNEL_PAGE_SIZE } from '../../constants/limits';
import { useStableId } from '../UtilityComponents/useStableId';

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'customMessageActions'
  | 'formatDate'
  | 'messageActions'
  | 'openThread'
  | 'reactionDetailsSort'
  | 'sortReactions'
  | 'sortReactionDetails';

type VirtualizedMessageListPropsForContext =
  | PropsDrilledToMessage
  | 'closeReactionSelectorOnClick'
  | 'customMessageRenderer'
  | 'head'
  | 'loadingMore'
  | 'Message'
  | 'shouldGroupByUser'
  | 'threadList';

/**
 * Context object provided to some Virtuoso props that are functions (components rendered by Virtuoso and other functions)
 */
export type VirtuosoContext = Required<
  Pick<
    ComponentContextValue,
    'DateSeparator' | 'MessageSystem' | 'UnreadMessagesSeparator'
  >
> &
  Pick<VirtualizedMessageListProps, VirtualizedMessageListPropsForContext> &
  Pick<ChatContextValue, 'customClasses'> & {
    /** Latest received message id in the current channel */
    lastReceivedMessageId: string | null | undefined;
    /** Object mapping between the message ID and a string representing the position in the group of a sequence of messages posted by the same user. */
    messageGroupStyles: Record<string, GroupStyle>;
    /** Number of messages prepended before the first page of messages. This is needed to calculate the virtual position in the virtual list. */
    numItemsPrepended: number;
    /** Mapping of message ID of own messages to the array of users, who read the given message */
    ownMessagesReadByOthers: Record<string, UserResponse[]>;
    /** The original message list enriched with date separators, omitted deleted messages or giphy previews. */
    processedMessages: RenderedMessage[];
    /** Instance of VirtuosoHandle object providing the API to navigate in the virtualized list by various scroll actions. */
    virtuosoRef: RefObject<VirtuosoHandle | null>;
    /** Message id which was marked as unread. ALl the messages following this message are considered unrea.  */
    firstUnreadMessageId?: string;
    lastReadDate?: Date;
    /**
     * The ID of the last message considered read by the current user in the current channel.
     * All the messages following this message are considered unread.
     */
    lastReadMessageId?: string;
    /** The number of unread messages in the current channel. */
    unreadMessageCount?: number;
  };

type VirtualizedMessageListWithContextProps = VirtualizedMessageListProps & {
  channel: Channel;
  hasMore: boolean;
  hasMoreNewer: boolean;
  jumpToLatestMessage: () => Promise<void>;
  loadingMore: boolean;
  loadingMoreNewer: boolean;
  notifications: ChannelNotifications;
  read?: StreamChannelState['read'];
};

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
  highlightedMessageId: string | undefined,
) {
  if (highlightedMessageId) {
    const index = findMessageIndex(messages, highlightedMessageId);
    if (index !== -1) {
      return { align: 'center', index } as const;
    }
  }
  return messages.length - 1;
}

const VirtualizedMessageListWithContext = (
  props: VirtualizedMessageListWithContextProps,
) => {
  const {
    additionalMessageInputProps,
    additionalVirtuosoProps = {},
    channel,
    channelUnreadUiState,
    closeReactionSelectorOnClick,
    customMessageActions,
    customMessageRenderer,
    defaultItemHeight,
    disableDateSeparator = true,
    formatDate,
    groupStyles,
    hasMoreNewer,
    head,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    highlightedMessageId,
    jumpToLatestMessage,
    loadingMore,
    loadMore,
    loadMoreNewer,
    maxTimeBetweenGroupedMessages,
    Message: MessageUIComponentFromProps,
    messageActions,
    messageLimit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
    messages,
    notifications,
    openThread,
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    overscan = 0,
    reactionDetailsSort,
    read,
    returnAllReadData = false,
    reviewProcessedMessage,
    scrollSeekPlaceHolder,
    scrollToLatestMessageOnFocus = false,
    separateGiphyPreview = false,
    shouldGroupByUser = false,
    showUnreadNotificationAlways,
    sortReactionDetails,
    sortReactions,
    stickToBottomScrollBehavior = 'smooth',
    suppressAutoscroll,
    threadList,
  } = props;

  const { components: virtuosoComponentsFromProps, ...overridingVirtuosoProps } =
    additionalVirtuosoProps;

  // Stops errors generated from react-virtuoso to bubble up
  // to Sentry or other tracking tools.
  useCaptureResizeObserverExceededError();

  const {
    DateSeparator = DefaultDateSeparator,
    GiphyPreviewMessage = DefaultGiphyPreviewMessage,
    MessageListMainPanel = DefaultMessageListMainPanel,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    MessageSystem = DefaultMessageSystem,
    TypingIndicator,
    UnreadMessagesNotification = DefaultUnreadMessagesNotification,
    UnreadMessagesSeparator = DefaultUnreadMessagesSeparator,
    VirtualMessage: MessageUIComponentFromContext = MessageSimple,
  } = useComponentContext('VirtualizedMessageList');
  const MessageUIComponent = MessageUIComponentFromProps || MessageUIComponentFromContext;

  const { client, customClasses } = useChatContext('VirtualizedMessageList');

  const virtuoso = useRef<VirtuosoHandle>(null);

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const { show: showUnreadMessagesNotification, toggleShowUnreadMessagesNotification } =
    useUnreadMessagesNotificationVirtualized({
      lastRead: channelUnreadUiState?.last_read,
      showAlways: !!showUnreadNotificationAlways,
      unreadCount: channelUnreadUiState?.unread_messages ?? 0,
    });

  const { giphyPreviewMessage, setGiphyPreviewMessage } =
    useGiphyPreview(separateGiphyPreview);

  const processedMessages = useMemo(() => {
    if (typeof messages === 'undefined') {
      return [];
    }

    if (
      disableDateSeparator &&
      !hideDeletedMessages &&
      hideNewMessageSeparator &&
      !separateGiphyPreview
    ) {
      return messages;
    }

    return processMessages({
      enableDateSeparator: !disableDateSeparator,
      hideDeletedMessages,
      hideNewMessageSeparator,
      lastRead,
      messages,
      reviewProcessedMessage,
      setGiphyPreviewMessage,
      userId: client.userID || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    disableDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    messages,
    messages?.length,
    client.userID,
  ]);

  // get the mapping of own messages to array of users who read them
  const ownMessagesReadByOthers = useLastReadData({
    messages: processedMessages,
    read,
    returnAllReadData,
    userID: client.userID,
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
    // processedMessages were incorrectly rebuilt with a new object identity at some point, hence the .length usage
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
  } = useNewMessageNotification(processedMessages, client.userID, hasMoreNewer);

  useMarkRead({
    isMessageListScrolledToBottom,
    messageListIsThread: !!threadList,
    wasMarkedUnread: !!channelUnreadUiState?.first_unread_message_id,
  });

  const scrollToBottom = useCallback(async () => {
    if (hasMoreNewer) {
      await jumpToLatestMessage();
      return;
    }

    if (virtuoso.current) {
      virtuoso.current.scrollToIndex(processedMessages.length - 1);
    }

    setNewMessagesNotification(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    virtuoso,
    processedMessages,
    setNewMessagesNotification,
    // processedMessages were incorrectly rebuilt with a new object identity at some point, hence the .length usage
    processedMessages.length,
    hasMoreNewer,
    jumpToLatestMessage,
  ]);

  useScrollToBottomOnNewMessage({
    messages,
    scrollToBottom,
    scrollToLatestMessageOnFocus,
  });

  const numItemsPrepended = usePrependedMessagesCount(
    processedMessages,
    !disableDateSeparator,
  );

  const { messageSetKey } = useMessageSetKey({ messages });

  const shouldForceScrollToBottom = useShouldForceScrollToBottom(
    processedMessages,
    client.userID,
  );

  const handleItemsRendered = useMemo(
    () =>
      makeItemsRenderedHandler([toggleShowUnreadMessagesNotification], processedMessages),
    [processedMessages, toggleShowUnreadMessagesNotification],
  );
  const followOutput = (isAtBottom: boolean) => {
    if (hasMoreNewer || suppressAutoscroll) {
      return false;
    }

    if (shouldForceScrollToBottom()) {
      return isAtBottom ? stickToBottomScrollBehavior : 'auto';
    }
    // a message from another user has been received - don't scroll to bottom unless already there
    return isAtBottom ? stickToBottomScrollBehavior : false;
  };

  const computeItemKey = useCallback<ComputeItemKey<UnknownType, VirtuosoContext>>(
    (index, _, { numItemsPrepended, processedMessages }) =>
      processedMessages[calculateItemIndex(index, numItemsPrepended)].id,
    [],
  );

  const atBottomStateChange = (isAtBottom: boolean) => {
    atBottom.current = isAtBottom;
    setIsMessageListScrolledToBottom(isAtBottom);

    if (isAtBottom) {
      loadMoreNewer?.(messageLimit);
      setNewMessagesNotification?.(false);
    }
  };
  const atTopStateChange = (isAtTop: boolean) => {
    if (isAtTop) {
      loadMore?.(messageLimit);
    }
  };

  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    if (highlightedMessageId) {
      const index = findMessageIndex(processedMessages, highlightedMessageId);
      if (index !== -1) {
        scrollTimeout = setTimeout(() => {
          virtuoso.current?.scrollToIndex({ align: 'center', index });
        }, 0);
      }
    }
    return () => {
      clearTimeout(scrollTimeout);
    };
  }, [highlightedMessageId, processedMessages]);

  const id = useStableId();

  if (!processedMessages) return null;

  const dialogManagerId = threadList
    ? `virtualized-message-list-dialog-manager-thread-${id}`
    : `virtualized-message-list-dialog-manager-${id}`;

  return (
    <VirtualizedMessageListContextProvider value={{ scrollToBottom }}>
      <MessageListMainPanel>
        <DialogManagerProvider id={dialogManagerId}>
          {!threadList && showUnreadMessagesNotification && (
            <UnreadMessagesNotification
              unreadCount={channelUnreadUiState?.unread_messages}
            />
          )}
          <div
            className={customClasses?.virtualizedMessageList || 'str-chat__virtual-list'}
          >
            <Virtuoso<UnknownType, VirtuosoContext>
              atBottomStateChange={atBottomStateChange}
              atBottomThreshold={100}
              atTopStateChange={atTopStateChange}
              atTopThreshold={100}
              className='str-chat__message-list-scroll'
              components={{
                EmptyPlaceholder,
                Header,
                Item,
                ...virtuosoComponentsFromProps,
              }}
              computeItemKey={computeItemKey}
              context={{
                additionalMessageInputProps,
                closeReactionSelectorOnClick,
                customClasses,
                customMessageActions,
                customMessageRenderer,
                DateSeparator,
                firstUnreadMessageId: channelUnreadUiState?.first_unread_message_id,
                formatDate,
                head,
                lastReadDate: channelUnreadUiState?.last_read,
                lastReadMessageId: channelUnreadUiState?.last_read_message_id,
                lastReceivedMessageId,
                loadingMore,
                Message: MessageUIComponent,
                messageActions,
                messageGroupStyles,
                MessageSystem,
                numItemsPrepended,
                openThread,
                ownMessagesReadByOthers,
                processedMessages,
                reactionDetailsSort,
                shouldGroupByUser,
                sortReactionDetails,
                sortReactions,
                threadList,
                unreadMessageCount: channelUnreadUiState?.unread_messages,
                UnreadMessagesSeparator,
                virtuosoRef: virtuoso,
              }}
              firstItemIndex={calculateFirstItemIndex(numItemsPrepended)}
              followOutput={followOutput}
              increaseViewportBy={{ bottom: 200, top: 0 }}
              initialTopMostItemIndex={calculateInitialTopMostItemIndex(
                processedMessages,
                highlightedMessageId,
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
              {...(scrollSeekPlaceHolder ? { scrollSeek: scrollSeekPlaceHolder } : {})}
              {...(defaultItemHeight ? { defaultItemHeight } : {})}
            />
          </div>
        </DialogManagerProvider>
        {TypingIndicator && <TypingIndicator />}
      </MessageListMainPanel>
      <MessageListNotifications
        hasNewMessages={newMessagesNotification}
        isMessageListScrolledToBottom={isMessageListScrolledToBottom}
        isNotAtLatestMessageSet={hasMoreNewer}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottom}
        threadList={threadList}
        unreadCount={threadList ? undefined : channelUnreadUiState?.unread_messages}
      />
      {giphyPreviewMessage && <GiphyPreviewMessage message={giphyPreviewMessage} />}
    </VirtualizedMessageListContextProvider>
  );
};

export type VirtualizedMessageListProps = Partial<
  Pick<MessageProps, PropsDrilledToMessage>
> & {
  /** Additional props to be passed the underlying [`react-virtuoso` virtualized list dependency](https://virtuoso.dev/virtuoso-api-reference/) */
  additionalVirtuosoProps?: VirtuosoProps<UnknownType, VirtuosoContext>;
  channelUnreadUiState?: ChannelStateContextValue['channelUnreadUiState'];
  /** If true, picking a reaction from the `ReactionSelector` component will close the selector */
  closeReactionSelectorOnClick?: boolean;
  /** Custom render function, if passed, certain UI props are ignored */
  customMessageRenderer?: (
    messageList: RenderedMessage[],
    index: number,
  ) => React.ReactElement;
  /** @deprecated Use additionalVirtuosoProps.defaultItemHeight instead. Will be removed with next major release - `v11.0.0`.
   * If set, the default item height is used for the calculation of the total list height. Use if you expect messages with a lot of height variance
   * */
  defaultItemHeight?: number;
  /** Disables the injection of date separator components in MessageList, defaults to `true` */
  disableDateSeparator?: boolean;
  /** Callback function to set group styles for each message */
  groupStyles?: (
    message: RenderedMessage,
    previousMessage: RenderedMessage,
    nextMessage: RenderedMessage,
    noGroupByUser: boolean,
    maxTimeBetweenGroupedMessages?: number,
  ) => GroupStyle;
  /** Whether or not the list has more items to load */
  hasMore?: boolean;
  /** Whether or not the list has newer items to load */
  hasMoreNewer?: boolean;
  /**
   * @deprecated Use additionalVirtuosoProps.components.Header to override default component rendered above the list ove messages.
   * Element to be rendered at the top of the thread message list. By default, these are the Message and ThreadStart components
   */
  head?: React.ReactElement;
  /** Hides the `MessageDeleted` components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  /** Hides the `DateSeparator` component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** The id of the message to highlight and center */
  highlightedMessageId?: string;
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Whether or not the list is currently loading newer items */
  loadingMoreNewer?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** Function called when new messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMoreNewer?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** Maximum time in milliseconds that should occur between messages to still consider them grouped together */
  maxTimeBetweenGroupedMessages?: number;
  /** Custom UI component to display a message, defaults to and accepts same props as [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageSimple.tsx) */
  Message?: React.ComponentType<MessageUIComponentProps>;
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** Optional prop to override the messages available from [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/) */
  messages?: LocalMessage[];
  /**
   * @deprecated Use additionalVirtuosoProps.overscan instead. Will be removed with next major release - `v11.0.0`.
   * The amount of extra content the list should render in addition to what's necessary to fill in the viewport
   */
  overscan?: number;
  /** Keep track of read receipts for each message sent by the user. When disabled, only the last own message delivery / read status is rendered. */
  returnAllReadData?: boolean;
  /**
   * Allows to review changes introduced to messages array on per message basis (e.g. date separator injected before a message).
   * The array returned from the function is appended to the array of messages that are later rendered into React elements in the `VirtualizedMessageList`.
   */
  reviewProcessedMessage?: ProcessMessagesParams['reviewProcessedMessage'];
  /**
   * @deprecated Pass additionalVirtuosoProps.scrollSeekConfiguration and specify the placeholder in additionalVirtuosoProps.components.ScrollSeekPlaceholder instead.  Will be removed with next major release - `v11.0.0`.
   * Performance improvement by showing placeholders if user scrolls fast through list.
   * it can be used like this:
   * ```
   *  {
   *    enter: (velocity) => Math.abs(velocity) > 120,
   *    exit: (velocity) => Math.abs(velocity) < 40,
   *    change: () => null,
   *    placeholder: ({index, height})=> <div style={{height: height + "px"}}>{index}</div>,
   *  }
   *  ```
   */
  scrollSeekPlaceHolder?: ScrollSeekConfiguration & {
    placeholder: React.ComponentType<ScrollSeekPlaceholderProps>;
  };
  /** When `true`, the list will scroll to the latest message when the window regains focus */
  scrollToLatestMessageOnFocus?: boolean;
  /** If true, the Giphy preview will render as a separate component above the `MessageInput`, rather than inline with the other messages in the list */
  separateGiphyPreview?: boolean;
  /** If true, group messages belonging to the same user, otherwise show each message individually */
  shouldGroupByUser?: boolean;
  /**
   * The floating notification informing about unread messages will be shown when the
   * UnreadMessagesSeparator is not visible. The default is false, that means the notification
   * is shown only when viewing unread messages.
   */
  showUnreadNotificationAlways?: boolean;
  /** The scrollTo behavior when new messages appear. Use `"smooth"` for regular chat channels, and `"auto"` (which results in instant scroll to bottom) if you expect high throughput. */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
  /** stops the list from autoscrolling when new messages are loaded */
  suppressAutoscroll?: boolean;
  /** If true, indicates the message list is a thread  */
  threadList?: boolean;
};

/**
 * The VirtualizedMessageList component renders a list of messages in a virtualized list.
 * It is a consumer of the React contexts set in [Channel](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Channel/Channel.tsx).
 */
export function VirtualizedMessageList(props: VirtualizedMessageListProps) {
  const { jumpToLatestMessage, loadMore, loadMoreNewer } = useChannelActionContext(
    'VirtualizedMessageList',
  );
  const {
    channel,
    channelUnreadUiState,
    hasMore,
    hasMoreNewer,
    highlightedMessageId,
    loadingMore,
    loadingMoreNewer,
    messages: contextMessages,
    notifications,
    read,
    suppressAutoscroll,
  } = useChannelStateContext('VirtualizedMessageList');

  const messages = props.messages || contextMessages;

  return (
    <VirtualizedMessageListWithContext
      channel={channel}
      channelUnreadUiState={props.channelUnreadUiState ?? channelUnreadUiState}
      hasMore={!!hasMore}
      hasMoreNewer={!!hasMoreNewer}
      highlightedMessageId={highlightedMessageId}
      jumpToLatestMessage={jumpToLatestMessage}
      loadingMore={!!loadingMore}
      loadingMoreNewer={!!loadingMoreNewer}
      loadMore={loadMore}
      loadMoreNewer={loadMoreNewer}
      messages={messages}
      notifications={notifications}
      read={read}
      suppressAutoscroll={suppressAutoscroll}
      {...props}
    />
  );
}
