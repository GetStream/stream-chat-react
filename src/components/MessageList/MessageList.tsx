import React from 'react';

import { useEnrichedMessages } from './hooks/useEnrichedMessages';
import { useMessageListElements } from './hooks/useMessageListElements';
import { useScrollLocationLogic } from './hooks/useScrollLocationLogic';

import { Center } from './Center';
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

  const ulRef = React.useRef<HTMLUListElement>(null);

  const { customClasses } = useChatContext<StreamChatGenerics>('MessageList');

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    TypingIndicator = DefaultTypingIndicator,
  } = useComponentContext<StreamChatGenerics>('MessageList');

  const {
    hasNewMessages,
    listRef,
    onMessageLoadCaptured,
    onScroll,
    scrollToBottom,
    wrapperRect,
  } = useScrollLocationLogic({
    hasMoreNewer,
    messages,
    scrolledUpThreshold: props.scrolledUpThreshold,
    suppressAutoscroll,
    ulRef,
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
    onMessageLoadCaptured,
    read,
    returnAllReadData,
    threadList,
  });

  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext(
    'useInternalInfiniteScrollProps',
  );

  const messageListClass = customClasses?.messageList || 'str-chat__list';
  const threadListClass = threadList ? customClasses?.threadList || 'str-chat__list--thread' : '';

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
      const element = ulRef.current?.querySelector(`[data-message-id='${highlightedMessageId}']`);
      element?.scrollIntoView({ block: 'center' });
    }
  }, [highlightedMessageId]);

  return (
    <>
      <div
        className={`${messageListClass} ${threadListClass}`}
        onScroll={onScroll}
        ref={listRef}
        tabIndex={0}
      >
        {!elements.length ? (
          <EmptyStateIndicator listType='message' />
        ) : (
          <InfiniteScroll
            className='str-chat__reverse-infinite-scroll'
            data-testid='reverse-infinite-scroll'
            hasMore={props.hasMore}
            hasMoreNewer={props.hasMoreNewer}
            isLoading={props.loadingMore}
            loader={
              <Center key='loadingindicator'>
                <LoadingIndicator size={20} />
              </Center>
            }
            loadMore={loadMore}
            loadMoreNewer={loadMoreNewer}
            {...props.internalInfiniteScrollProps}
          >
            <ul className='str-chat__ul' ref={ulRef}>
              {elements}
            </ul>
            <TypingIndicator threadList={threadList} />
            <div key='bottom' />
          </InfiniteScroll>
        )}
      </div>
      <MessageListNotifications
        hasNewMessages={hasNewMessages}
        isNotAtLatestMessageSet={hasMoreNewer}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottomFromNotification}
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
  /** Whether or not the list has more items to load */
  hasMore?: boolean;
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
  /** The pixel threshold to determine whether or not the user is scrolled up in the list, defaults to 200px */
  scrolledUpThreshold?: number;
  /** If true, indicates the message list is a thread  */
  threadList?: boolean;
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
