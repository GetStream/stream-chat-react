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
import { UnreadMessagesNotification as DefaultUnreadMessagesNotification } from './UnreadMessagesNotification';

import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import type { ChannelStateContextValue } from '../../context/ChannelStateContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { DialogManagerProvider } from '../../context';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageListContextProvider } from '../../context/MessageListContext';
import { MessageTranslationViewProvider } from '../../context/MessageTranslationViewContext';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import type { InfiniteScrollProps } from '../InfiniteScrollPaginator/InfiniteScroll';
import { InfiniteScroll } from '../InfiniteScrollPaginator/InfiniteScroll';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';

import { FloatingDateSeparator } from './FloatingDateSeparator';
import type { MessageRenderer } from './renderMessages';
import { defaultRenderMessages } from './renderMessages';
import { useStableId } from '../UtilityComponents/useStableId';

import type { LocalMessage } from 'stream-chat';
import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from './utils';
import type { MessageProps } from '../Message/types';

import {
  DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
} from '../../constants/limits';
import { useLastOwnMessage } from './hooks/useLastOwnMessage';
import { ScrollToLatestMessageButton } from './ScrollToLatestMessageButton';
import {
  NotificationList as DefaultNotificationList,
  useNotificationTarget,
} from '../Notifications';

type MessageListWithContextProps = Omit<
  ChannelStateContextValue,
  'members' | 'mutes' | 'watchers'
> &
  MessageListProps;

type JumpToLatestPhase = 'idle' | 'waiting-for-render' | 'animating';
type HighlightedJumpPhase = 'idle' | 'waiting-for-render' | 'animating';

const getMessageSetSignature = (messages: LocalMessage[]) =>
  `${messages.length}:${messages[0]?.id || ''}:${messages[messages.length - 1]?.id || ''}`;

const getMessageTimestamp = (message?: LocalMessage) =>
  message?.created_at?.getTime?.() ?? null;

const MessageListWithContext = (props: MessageListWithContextProps) => {
  const {
    channel,
    channelUnreadUiState,
    disableDateSeparator = false,
    groupStyles,
    hasMoreNewer = false,
    headerPosition,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    highlightedMessageId,
    internalInfiniteScrollProps: {
      threshold: loadMoreScrollThreshold = DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
      ...restInternalInfiniteScrollProps
    } = {},
    jumpToLatestMessage = () => Promise.resolve(),
    loadMore: loadMoreCallback,
    loadMoreNewer: loadMoreNewerCallback,
    maxTimeBetweenGroupedMessages,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    messageLimit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
    messages = [],
    noGroupByUser = false,
    reactionDetailsSort,
    renderMessages = defaultRenderMessages,
    returnAllReadData = false,
    reviewProcessedMessage,
    showUnreadNotificationAlways,
    sortReactions,
    suppressAutoscroll,
    threadList = false,
    unsafeHTML = false,
  } = props;

  const [listElement, setListElement] = React.useState<HTMLDivElement | null>(null);
  const [jumpToLatestPhase, setJumpToLatestPhase] =
    React.useState<JumpToLatestPhase>('idle');
  const [highlightedJumpPhase, setHighlightedJumpPhase] =
    React.useState<HighlightedJumpPhase>('idle');
  const [jumpSourceMessageSetSignature, setJumpSourceMessageSetSignature] =
    React.useState<string | null>(null);
  const previousHasMoreNewerRef = React.useRef(hasMoreNewer);
  const previousMessageSetSignatureRef = React.useRef('');
  const previousMessageSetBoundsRef = React.useRef<{
    firstTimestamp: number | null;
    lastTimestamp: number | null;
  }>({
    firstTimestamp: null,
    lastTimestamp: null,
  });

  const { customClasses } = useChatContext('MessageList');

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

  const notificationTarget = useNotificationTarget();
  const messageSetSignature = React.useMemo(
    () => getMessageSetSignature(messages),
    [messages],
  );
  const messageSetBounds = React.useMemo(
    () => ({
      firstTimestamp: getMessageTimestamp(messages[0]),
      lastTimestamp: getMessageTimestamp(messages[messages.length - 1]),
    }),
    [messages],
  );
  const isJumpingToLatest = jumpToLatestPhase !== 'idle';
  // Highlighted jumps temporarily disable prepend pagination so a target
  // message rendered near the top does not immediately load the previous page.
  const isJumpingToHighlightedMessage = highlightedJumpPhase !== 'idle';
  const justReachedLatestMergedSet = previousHasMoreNewerRef.current && !hasMoreNewer;

  const {
    hasNewMessages,
    isMessageListScrolledToBottom,
    onScroll,
    scrollToBottom,
    wrapperRect,
  } = useScrollLocationLogic({
    disableAutoScrollToBottom: isJumpingToLatest || justReachedLatestMergedSet,
    disableScrollManagement: isJumpingToLatest || isJumpingToHighlightedMessage,
    hasMoreNewer,
    listElement,
    loadingMore: props.loadingMore,
    loadMoreScrollThreshold,
    messages, // todo: is it correct to base the scroll logic on an array that does not contain date separators or intro?
    scrolledUpThreshold: props.scrolledUpThreshold,
    suppressAutoscroll,
  });
  const isTypingIndicatorScrolledToBottom =
    isMessageListScrolledToBottom &&
    !isJumpingToLatest &&
    !isJumpingToHighlightedMessage &&
    !justReachedLatestMergedSet;

  const { show: showUnreadMessagesNotification } = useUnreadMessagesNotification({
    isMessageListScrolledToBottom,
    listElement,
    showAlways: !!showUnreadNotificationAlways,
    unreadCount: channelUnreadUiState?.unread_messages,
  });

  useMarkRead({
    isMessageListScrolledToBottom: isTypingIndicatorScrolledToBottom,
    messageListIsThread: threadList,
    wasMarkedUnread: !!channelUnreadUiState?.first_unread_message_id,
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
    channelUnreadUiState,
    enrichedMessages,
    internalMessageProps: {
      additionalMessageComposerProps: props.additionalMessageComposerProps,
      closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
      disableQuotedMessages: props.disableQuotedMessages,
      formatDate: props.formatDate,
      Message: props.Message,
      messageActions,
      messageListRect: wrapperRect,
      onlySenderCanEdit: props.onlySenderCanEdit,
      onMentionsClick: props.onMentionsClick,
      onMentionsHover: props.onMentionsHover,
      onUserClick: props.onUserClick,
      onUserHover: props.onUserHover,
      openThread: props.openThread,
      reactionDetailsSort,
      renderText: props.renderText,
      retrySendMessage: props.retrySendMessage,
      showAvatar: props.showAvatar,
      sortReactions,
      unsafeHTML,
    },
    lastOwnMessage,
    messageGroupStyles,
    messages,
    renderMessages,
    returnAllReadData,
    threadList,
  });

  const messageListClass = customClasses?.messageList || 'str-chat__message-list';

  const loadMore = React.useCallback(() => {
    if (loadMoreCallback) {
      loadMoreCallback(messageLimit);
    }
  }, [loadMoreCallback, messageLimit]);

  const loadMoreNewer = React.useCallback(() => {
    if (loadMoreNewerCallback) {
      loadMoreNewerCallback(messageLimit);
    }
  }, [loadMoreNewerCallback, messageLimit]);

  const scrollToBottomFromNotification = React.useCallback(async () => {
    if (hasMoreNewer) {
      setJumpSourceMessageSetSignature(messageSetSignature);
      setJumpToLatestPhase('waiting-for-render');
      try {
        await jumpToLatestMessage();
      } catch (error) {
        setJumpSourceMessageSetSignature(null);
        setJumpToLatestPhase('idle');
        throw error;
      }
      return;
    }

    scrollToBottom({ behavior: 'smooth' });
  }, [hasMoreNewer, jumpToLatestMessage, messageSetSignature, scrollToBottom]);

  React.useLayoutEffect(() => {
    if (
      jumpToLatestPhase !== 'waiting-for-render' ||
      hasMoreNewer ||
      !listElement?.scrollTo ||
      messageSetSignature === jumpSourceMessageSetSignature
    ) {
      return;
    }

    listElement.scrollTo({ top: 0 });

    const animationFrameId = requestAnimationFrame(() => {
      setJumpToLatestPhase('animating');
      listElement.scrollTo({
        behavior: 'smooth',
        top: listElement.scrollHeight,
      });
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [
    hasMoreNewer,
    jumpSourceMessageSetSignature,
    jumpToLatestPhase,
    listElement,
    messageSetSignature,
  ]);

  React.useLayoutEffect(() => {
    if (jumpToLatestPhase !== 'animating' || !listElement?.scrollTo) {
      return;
    }

    const finalize = () => {
      listElement.scrollTo({ top: listElement.scrollHeight });
      setJumpSourceMessageSetSignature(null);
      setJumpToLatestPhase('idle');
    };

    const settleTimeoutId = setTimeout(finalize, 500);

    return () => {
      clearTimeout(settleTimeoutId);
    };
  }, [jumpToLatestPhase, listElement]);

  React.useLayoutEffect(() => {
    if (!highlightedMessageId) {
      setHighlightedJumpPhase('idle');
      return;
    }

    const element = listElement?.querySelector(
      `[data-message-id='${highlightedMessageId}']`,
    );
    if (!element) {
      setHighlightedJumpPhase('waiting-for-render');
      return;
    }

    const messageSetChanged =
      previousMessageSetSignatureRef.current !== messageSetSignature;
    setHighlightedJumpPhase(messageSetChanged ? 'animating' : 'idle');
    let settleTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const animationFrameId = requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      if (!messageSetChanged || !listElement?.scrollTo) {
        setHighlightedJumpPhase('idle');
        return;
      }

      settleTimeoutId = setTimeout(() => {
        const elementRect = element.getBoundingClientRect();
        const listRect = listElement.getBoundingClientRect();
        const targetTop =
          listElement.scrollTop +
          (elementRect.top - listRect.top) -
          (listElement.clientHeight - elementRect.height) / 2;

        listElement.scrollTo({ top: Math.max(targetTop, 0) });
        setHighlightedJumpPhase('idle');
      }, 500);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (settleTimeoutId) {
        clearTimeout(settleTimeoutId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedMessageId, messageSetSignature]);

  React.useEffect(() => {
    previousHasMoreNewerRef.current = hasMoreNewer;
  }, [hasMoreNewer]);

  React.useEffect(() => {
    previousMessageSetSignatureRef.current = messageSetSignature;
    previousMessageSetBoundsRef.current = messageSetBounds;
  }, [messageSetBounds, messageSetSignature]);

  const id = useStableId();

  const showEmptyStateIndicator = elements.length === 0 && !threadList;
  const dialogManagerId = threadList
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
            {!threadList && showUnreadMessagesNotification && (
              <UnreadMessagesNotification
                unreadCount={channelUnreadUiState?.unread_messages}
              />
            )}
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
                <EmptyStateIndicator listType={threadList ? 'thread' : 'message'} />
              ) : (
                <InfiniteScroll
                  className='str-chat__message-list-scroll'
                  data-testid='reverse-infinite-scroll'
                  hasNextPage={props.hasMoreNewer}
                  hasPreviousPage={isJumpingToHighlightedMessage ? false : props.hasMore}
                  head={props.head}
                  isLoading={Boolean(
                    props.loadingMore || props.loadingMoreForJumpToChannelMessage,
                  )}
                  loader={
                    <div className='str-chat__list__loading' key='loading-indicator'>
                      {(props.loadingMore ||
                        props.loadingMoreForJumpToChannelMessage) && <LoadingIndicator />}
                    </div>
                  }
                  loadNextPage={loadMoreNewer}
                  loadPreviousPage={
                    isJumpingToHighlightedMessage ? () => undefined : loadMore
                  }
                  threshold={loadMoreScrollThreshold}
                  {...restInternalInfiniteScrollProps}
                >
                  <MessageListWrapper className='str-chat__ul'>
                    {elements}
                  </MessageListWrapper>
                  <TypingIndicator
                    isMessageListScrolledToBottom={isTypingIndicatorScrolledToBottom}
                    scrollToBottom={scrollToBottom}
                    threadList={threadList}
                  />

                  <div key='bottom' />
                </InfiniteScroll>
              )}
            </div>
            <NewMessageNotification
              newMessageCount={channelUnreadUiState?.unread_messages}
              showNotification={hasNewMessages || hasMoreNewer}
            />
            <ScrollToLatestMessageButton
              isMessageListScrolledToBottom={isMessageListScrolledToBottom}
              isNotAtLatestMessageSet={hasMoreNewer}
              onClick={scrollToBottomFromNotification}
              threadList={threadList}
            />
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
  | 'Message'
  | 'messageActions'
  | 'onlySenderCanEdit'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'openThread'
  | 'reactionDetailsSort'
  | 'renderText'
  | 'retrySendMessage'
  | 'showAvatar'
  | 'sortReactions'
  | 'unsafeHTML';

export type MessageListProps = Partial<Pick<MessageProps, PropsDrilledToMessage>> & {
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
  /** Hides the MessageDeleted components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  /** Hides the DateSeparator component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** Overrides the default props passed to [InfiniteScroll](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator/InfiniteScroll.tsx) */
  internalInfiniteScrollProps?: Partial<InfiniteScrollProps>;
  /** Function called when latest messages should be loaded, after the list has jumped at an earlier message set */
  jumpToLatestMessage?: () => Promise<void>;
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Whether or not the list is currently jumping to a highlighted message */
  loadingMoreForJumpToChannelMessage?: boolean;
  /** Whether or not the list is currently loading newer items */
  loadingMoreNewer?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** Function called when newer messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMoreNewer?: ChannelActionContextValue['loadMoreNewer'] | (() => Promise<void>);
  /** Maximum time in milliseconds that should occur between messages to still consider them grouped together */
  maxTimeBetweenGroupedMessages?: number;
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** The messages to render in the list, defaults to messages stored in [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/) */
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
  /** If true, indicates the message list is a thread  */
  threadList?: boolean; // todo: refactor needed - message list should have a state in which among others it would be optionally flagged as thread
};

/**
 * The MessageList component renders a list of Messages.
 * It is a consumer of the following contexts:
 * - [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/)
 * - [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/)
 * - [ComponentContext](https://getstream.io/chat/docs/sdk/react/contexts/component_context/)
 * - [TypingContext](https://getstream.io/chat/docs/sdk/react/contexts/typing_context/)
 */
export const MessageList = (props: MessageListProps) => {
  const { jumpToLatestMessage, loadMore, loadMoreNewer } =
    useChannelActionContext('MessageList');

  const {
    members: membersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    mutes: mutesPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchers: watchersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...restChannelStateContext
  } = useChannelStateContext('MessageList');

  return (
    <MessageListWithContext
      jumpToLatestMessage={jumpToLatestMessage}
      loadMore={loadMore}
      loadMoreNewer={loadMoreNewer}
      {...restChannelStateContext}
      {...props}
    />
  );
};
