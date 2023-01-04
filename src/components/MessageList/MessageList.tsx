import React from 'react';

import { useEnrichedMessages } from './hooks/useEnrichedMessages';
import { useMessageListElements } from './hooks/useMessageListElements';
import { useScrollLocationLogic } from './hooks/useScrollLocationLogic';

import { MessageNotification as DefaultMessageNotification } from './MessageNotification';
import { MessageListNotifications as DefaultMessageListNotifications } from './MessageListNotifications';

import {
  ChannelActionContextValue,
  useChannelActionContext,
} from '../../context/ChannelActionContext';
import {
  ChannelStateContextValue,
  useChannelStateContext,
} from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScroll, InfiniteScrollProps } from '../InfiniteScrollPaginator/InfiniteScroll';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';
import { MessageListMainPanel } from './MessageListMainPanel';

import type { GroupStyle } from './utils';

import type { MessageProps } from '../Message/types';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MessageListWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Omit<ChannelStateContextValue<StreamChatGenerics>, 'members' | 'mutes' | 'watchers'> &
  MessageListProps<StreamChatGenerics>;

const MessageListWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageListWithContextProps<StreamChatGenerics>,
) => {
  const {
    channel,
    disableDateSeparator = false,
    groupStyles,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    internalInfiniteScrollProps,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    messages = [],
    notifications,
    noGroupByUser = false,
    pinPermissions = defaultPinPermissions, // @deprecated in favor of `channelCapabilities` - TODO: remove in next major release
    returnAllReadData = false,
    threadList = false,
    unsafeHTML = false,
    headerPosition,
    read,
    messageLimit = 100,
    loadMore: loadMoreCallback,
    loadMoreNewer: loadMoreNewerCallback,
    hasMoreNewer = false,
    suppressAutoscroll,
    highlightedMessageId,
    jumpToLatestMessage = () => Promise.resolve(),
  } = props;

  const [listElement, setListElement] = React.useState<HTMLDivElement | null>(null);
  const [ulElement, setUlElement] = React.useState<HTMLUListElement | null>(null);

  const { customClasses } = useChatContext<StreamChatGenerics>('MessageList');

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    TypingIndicator = DefaultTypingIndicator,
  } = useComponentContext<StreamChatGenerics>('MessageList');

  const loadMoreScrollThreshold = internalInfiniteScrollProps?.threshold || 250;

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
    messages,
    scrolledUpThreshold: props.scrolledUpThreshold,
    suppressAutoscroll,
  });

  const { messageGroupStyles, messages: enrichedMessages } = useEnrichedMessages({
    channel,
    disableDateSeparator,
    groupStyles,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    messages,
    noGroupByUser,
  });

  const elements = useMessageListElements({
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
      renderText: props.renderText,
      retrySendMessage: props.retrySendMessage,
      unsafeHTML,
    },
    messageGroupStyles,
    read,
    returnAllReadData,
    threadList,
  });

  const messageListClass = customClasses?.messageList || 'str-chat__list';
  const threadListClass = threadList
    ? customClasses?.threadList || 'str-chat__list--thread str-chat__thread-list'
    : '';

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
  }, [scrollToBottom, hasMoreNewer]);

  React.useLayoutEffect(() => {
    if (highlightedMessageId) {
      const element = ulElement?.querySelector(`[data-message-id='${highlightedMessageId}']`);
      element?.scrollIntoView({ block: 'center' });
    }
  }, [highlightedMessageId]);

  const showEmptyStateIndicator = elements.length === 0 && !threadList;

  return (
    <>
      <MessageListMainPanel>
        <div
          className={`${messageListClass} ${threadListClass}`}
          onScroll={onScroll}
          ref={setListElement}
          tabIndex={0}
        >
          {showEmptyStateIndicator ? (
            <EmptyStateIndicator
              key={'empty-state-indicator'}
              listType={threadList ? 'thread' : 'message'}
            />
          ) : (
            <InfiniteScroll
              className='str-chat__reverse-infinite-scroll  str-chat__message-list-scroll'
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
              {...props.internalInfiniteScrollProps}
              threshold={loadMoreScrollThreshold}
            >
              <ul className='str-chat__ul' ref={setUlElement}>
                {elements}
              </ul>
              <TypingIndicator threadList={threadList} />

              <div key='bottom' />
            </InfiniteScroll>
          )}
        </div>
      </MessageListMainPanel>
      <MessageListNotifications
        hasNewMessages={hasNewMessages}
        isMessageListScrolledToBottom={isMessageListScrolledToBottom}
        isNotAtLatestMessageSet={hasMoreNewer}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottomFromNotification}
        threadList={threadList}
      />
    </>
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
  | 'renderText'
  | 'retrySendMessage'
  | 'unsafeHTML';

export type MessageListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = Partial<Pick<MessageProps<StreamChatGenerics>, PropsDrilledToMessage>> & {
  /** Disables the injection of date separator components in MessageList, defaults to `false` */
  disableDateSeparator?: boolean;
  /** Callback function to set group styles for each message */
  groupStyles?: (
    message: StreamMessage<StreamChatGenerics>,
    previousMessage: StreamMessage<StreamChatGenerics>,
    nextMessage: StreamMessage<StreamChatGenerics>,
    noGroupByUser: boolean,
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
  internalInfiniteScrollProps?: InfiniteScrollProps;
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
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** The messages to render in the list, defaults to messages stored in [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/) */
  messages?: StreamMessage<StreamChatGenerics>[];
  /** If true, turns off message UI grouping by user */
  noGroupByUser?: boolean;
  /** If true, `readBy` data supplied to the `Message` components will include all user read states per sent message */
  returnAllReadData?: boolean;
  /**
   * The pixel threshold under which the message list is considered to be so near to the bottom,
   * so that if a new message is delivered, the list will be scrolled to the absolute bottom.
   * Defaults to 200px
   */
  scrolledUpThreshold?: number;
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
export const MessageList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageListProps<StreamChatGenerics>,
) => {
  const {
    jumpToLatestMessage,
    loadMore,
    loadMoreNewer,
  } = useChannelActionContext<StreamChatGenerics>('MessageList');

  const {
    members: membersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    mutes: mutesPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchers: watchersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...restChannelStateContext
  } = useChannelStateContext<StreamChatGenerics>('MessageList');

  return (
    <MessageListWithContext<StreamChatGenerics>
      jumpToLatestMessage={jumpToLatestMessage}
      loadMore={loadMore}
      loadMoreNewer={loadMoreNewer}
      {...restChannelStateContext}
      {...props}
    />
  );
};
