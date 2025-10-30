import clsx from 'clsx';
import React from 'react';

import {
  useEnrichedMessages,
  useMessageListElements,
  useScrollLocationLogic,
  useUnreadMessagesNotification,
} from './hooks/MessageList';
import { useMarkRead } from './hooks/useMarkRead';

import { MessageNotification as DefaultMessageNotification } from './MessageNotification';
import { MessageListNotifications as DefaultMessageListNotifications } from './MessageListNotifications';
import { UnreadMessagesNotification as DefaultUnreadMessagesNotification } from './UnreadMessagesNotification';

import type { ChannelActionContextValue } from '../../context/ChannelActionContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { DialogManagerProvider } from '../../context';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageListContextProvider } from '../../context/MessageListContext';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import type { InfiniteScrollProps } from '../InfiniteScrollPaginator/InfiniteScroll';
import { InfiniteScroll } from '../InfiniteScrollPaginator/InfiniteScroll';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';
import { MessageListMainPanel as DefaultMessageListMainPanel } from './MessageListMainPanel';

import { defaultRenderMessages } from './renderMessages';
import { useStableId } from '../UtilityComponents/useStableId';

import type { LocalMessage } from 'stream-chat';
import type { MessageRenderer } from './renderMessages';
import type { GroupStyle, ProcessMessagesParams, RenderedMessage } from './utils';
import type { MessageProps } from '../Message/types';
import type { ChannelStateContextValue } from '../../context/ChannelStateContext';

import {
  DEFAULT_LOAD_PAGE_SCROLL_THRESHOLD,
  DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
} from '../../constants/limits';
import { useLastOwnMessage } from './hooks/useLastOwnMessage';

type MessageListWithContextProps = Omit<
  ChannelStateContextValue,
  'members' | 'mutes' | 'watchers'
> &
  MessageListProps;

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
    loadMoreNewer: loadMoreNewerCallback, // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
    maxTimeBetweenGroupedMessages,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    messageLimit = DEFAULT_NEXT_CHANNEL_PAGE_SIZE,
    messages = [],
    noGroupByUser = false,
    notifications,
    pinPermissions = defaultPinPermissions,
    reactionDetailsSort,
    renderMessages = defaultRenderMessages,
    returnAllReadData = false,
    reviewProcessedMessage,
    showUnreadNotificationAlways,
    sortReactionDetails,
    sortReactions,
    suppressAutoscroll,
    threadList = false,
    unsafeHTML = false,
  } = props;

  const [listElement, setListElement] = React.useState<HTMLDivElement | null>(null);
  const [ulElement, setUlElement] = React.useState<HTMLUListElement | null>(null);

  const { customClasses } = useChatContext('MessageList');

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListMainPanel = DefaultMessageListMainPanel,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    TypingIndicator = DefaultTypingIndicator,
    UnreadMessagesNotification = DefaultUnreadMessagesNotification,
  } = useComponentContext('MessageList');

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
    showAlways: !!showUnreadNotificationAlways,
    unreadCount: channelUnreadUiState?.unread_messages,
  });

  useMarkRead({
    isMessageListScrolledToBottom,
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
      additionalMessageInputProps: props.additionalMessageInputProps,
      closeReactionSelectorOnClick: props.closeReactionSelectorOnClick,
      customMessageActions: props.customMessageActions,
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
      openThread: props.openThread,
      pinPermissions,
      reactionDetailsSort,
      renderText: props.renderText,
      retrySendMessage: props.retrySendMessage,
      sortReactionDetails,
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

  const messageListClass = customClasses?.messageList || 'str-chat__list';

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
      await jumpToLatestMessage();
    } else {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToBottom, hasMoreNewer]);

  React.useLayoutEffect(() => {
    if (highlightedMessageId) {
      const element = ulElement?.querySelector(
        `[data-message-id='${highlightedMessageId}']`,
      );
      element?.scrollIntoView({ block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedMessageId]);

  const id = useStableId();

  const showEmptyStateIndicator = elements.length === 0 && !threadList;
  const dialogManagerId = threadList
    ? `message-list-dialog-manager-thread-${id}`
    : `message-list-dialog-manager-${id}`;

  return (
    <MessageListContextProvider value={{ listElement, scrollToBottom }}>
      <MessageListMainPanel>
        <DialogManagerProvider id={dialogManagerId}>
          {!threadList && showUnreadMessagesNotification && (
            <UnreadMessagesNotification
              unreadCount={channelUnreadUiState?.unread_messages}
            />
          )}
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
                hasPreviousPage={props.hasMore}
                head={props.head}
                isLoading={props.loadingMore}
                loader={
                  <div className='str-chat__list__loading' key='loading-indicator'>
                    {props.loadingMore && <LoadingIndicator size={20} />}
                  </div>
                }
                loadNextPage={loadMoreNewer}
                loadPreviousPage={loadMore}
                threshold={loadMoreScrollThreshold}
                {...restInternalInfiniteScrollProps}
              >
                <ul className='str-chat__ul' ref={setUlElement}>
                  {elements}
                </ul>
                <TypingIndicator threadList={threadList} />

                <div key='bottom' />
              </InfiniteScroll>
            )}
          </div>
        </DialogManagerProvider>
      </MessageListMainPanel>
      <MessageListNotifications
        hasNewMessages={hasNewMessages}
        isMessageListScrolledToBottom={isMessageListScrolledToBottom}
        isNotAtLatestMessageSet={hasMoreNewer}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottomFromNotification}
        threadList={threadList}
        unreadCount={threadList ? undefined : channelUnreadUiState?.unread_messages}
      />
    </MessageListContextProvider>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'closeReactionSelectorOnClick'
  | 'customMessageActions'
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
  | 'openThread'
  | 'pinPermissions' // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
  | 'reactionDetailsSort'
  | 'renderText'
  | 'retrySendMessage'
  | 'sortReactions'
  | 'sortReactionDetails'
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
