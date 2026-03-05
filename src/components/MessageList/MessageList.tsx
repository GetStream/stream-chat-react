import clsx from 'clsx';
import React from 'react';

import {
  useEnrichedMessages,
  useMessageListElements,
  useScrollLocationLogic,
  useUnreadMessagesNotification,
} from './hooks/MessageList';
import { useMarkRead } from './hooks/useMarkRead';

import { MessageListNotifications as DefaultMessageListNotifications } from './MessageListNotifications';
import { NewMessageNotification as DefaultNewMessageNotification } from './NewMessageNotification';
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
    sortReactionDetails,
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

  const { customClasses } = useChatContext('MessageList');

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListMainPanel = DefaultMessageListMainPanel,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageListWrapper = 'ul',
    NewMessageNotification = DefaultNewMessageNotification,
    TypingIndicator = DefaultTypingIndicator,
    UnreadMessagesNotification = DefaultUnreadMessagesNotification,
  } = useComponentContext('MessageList');
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
    isMessageListScrolledToBottom,
    messageListIsThread: isThreadList,
  });

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
    // channelUnreadUiState,
    enrichedMessages,
    focusedMessageId,
    internalMessageProps: {
      additionalMessageInputProps: props.additionalMessageInputProps,
      closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
      disableQuotedMessages: props.disableQuotedMessages,
      formatDate: props.formatDate,
      getDeleteMessageErrorNotification: props.getDeleteMessageErrorNotification,
      getFlagMessageErrorNotification: props.getFlagMessageErrorNotification,
      getFlagMessageSuccessNotification: props.getFlagMessageSuccessNotification,
      getMarkMessageUnreadErrorNotification: props.getMarkMessageUnreadErrorNotification,
      getMarkMessageUnreadSuccessNotification:
        props.getMarkMessageUnreadSuccessNotification,
      getMuteUserErrorNotification: props.getMuteUserErrorNotification,
      getMuteUserSuccessNotification: props.getMuteUserSuccessNotification,
      getPinMessageErrorNotification: props.getPinMessageErrorNotification,
      Message: props.Message,
      messageActions,
      messageListRect: wrapperRect,
      onlySenderCanEdit: props.onlySenderCanEdit,
      onMentionsClick: props.onMentionsClick,
      onMentionsHover: props.onMentionsHover,
      onUserClick: props.onUserClick,
      onUserHover: props.onUserHover,
      reactionDetailsSort,
      renderText: props.renderText,
      // retrySendMessage: props.retrySendMessage,
      showAvatar: props.showAvatar,
      sortReactionDetails,
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

  // const loadMore = React.useCallback(() => {
  //   if (loadMoreCallback) {
  //     loadMoreCallback(messageLimit);
  //   }
  // }, [loadMoreCallback, messageLimit]);

  // const loadMoreNewer = React.useCallback(() => {
  //   if (loadMoreNewerCallback) {
  //     loadMoreNewerCallback(messageLimit);
  //   }
  // }, [loadMoreNewerCallback, messageLimit]);

  const scrollToBottomFromNotification = React.useCallback(() => {
    if (messagePaginator.hasMoreHead) {
      messagePaginator.jumpToTheLatestMessage();
    } else {
      scrollToBottom();
    }
  }, [messagePaginator, scrollToBottom]);

  React.useLayoutEffect(() => {
    if (!focusedMessageId) return;
    const element = listElement?.querySelector(`[data-message-id='${focusedMessageId}']`);
    element?.scrollIntoView({ block: 'center' });
  }, [focusedMessageId, listElement]);

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
                      {props.loadingMore && <LoadingIndicator size={20} />}
                    </div>
                  )}
                  <MessageListWrapper className='str-chat__ul'>
                    {elements}
                  </MessageListWrapper>
                  <TypingIndicator />

                  <div key='bottom' />
                </InfiniteScrollPaginator>
              )}
              <NewMessageNotification
                newMessageCount={channelUnreadUiState?.unreadCount}
                showNotification={hasNewMessages || hasMoreNewer}
              />
              <ScrollToLatestMessageButton
                isMessageListScrolledToBottom={isMessageListScrolledToBottom}
                isNotAtLatestMessageSet={hasMoreNewer}
                onClick={scrollToBottomFromNotification}
              />
            </div>
            <NewMessageNotification
              newMessageCount={channelUnreadUiState?.unreadCount}
              showNotification={hasNewMessages || hasMoreNewer}
            />
            <ScrollToLatestMessageButton
              isMessageListScrolledToBottom={isMessageListScrolledToBottom}
              isNotAtLatestMessageSet={hasMoreNewer}
              onClick={scrollToBottomFromNotification}
            />
          </DialogManagerProvider>
        </MessageListMainPanel>
        <MessageListNotifications />
      </MessageTranslationViewProvider>
    </MessageListContextProvider>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'closeReactionSelectorOnClick'
  | 'disableQuotedMessages'
  | 'formatDate'
  | 'getDeleteMessageErrorNotification'
  | 'getFlagMessageErrorNotification'
  | 'getFlagMessageSuccessNotification'
  | 'getMarkMessageUnreadErrorNotification'
  | 'getMarkMessageUnreadSuccessNotification'
  | 'getMuteUserErrorNotification'
  | 'getMuteUserSuccessNotification'
  | 'getPinMessageErrorNotification'
  | 'Message'
  | 'messageActions'
  | 'onlySenderCanEdit'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'reactionDetailsSort'
  | 'renderText'
  // | 'retrySendMessage'
  | 'showAvatar'
  | 'sortReactions'
  | 'sortReactionDetails'
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
  /** Position to render HeaderComponent */
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
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const MessageList = (props: MessageListProps) => (
  <MessageListWithContext {...props} />
);
