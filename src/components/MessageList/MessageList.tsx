import React from 'react';

import { useCallLoadMore } from './hooks/useCallLoadMore';
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
import { InfiniteScroll, InfiniteScrollProps } from '../InfiniteScrollPaginator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';

import type { MessageProps } from '../Message/types';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

const useInternalInfiniteScrollProps = (
  props: Pick<
    MessageListWithContextProps,
    'hasMore' | 'internalInfiniteScrollProps' | 'loadMore' | 'loadingMore' | 'messageLimit'
  >,
) => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext(
    'useInternalInfiniteScrollProps',
  );

  return {
    hasMore: props.hasMore,
    isLoading: props.loadingMore,
    loader: (
      <Center key='loadingindicator'>
        <LoadingIndicator size={20} />
      </Center>
    ),
    loadMore: useCallLoadMore(props.loadMore, props.messageLimit || 100),
    ...props.internalInfiniteScrollProps,
  };
};

type MessageListWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'members' | 'mutes' | 'watchers'> &
  MessageListProps<At, Ch, Co, Ev, Me, Re, Us>;

const MessageListWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    disableDateSeparator = false,
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
  } = props;

  const { customClasses } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('MessageList');

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    TypingIndicator = DefaultTypingIndicator,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('MessageList');

  const {
    hasNewMessages,
    listRef,
    onMessageLoadCaptured,
    onScroll,
    scrollToBottom,
    wrapperRect,
  } = useScrollLocationLogic({
    messages,
    scrolledUpThreshold: props.scrolledUpThreshold,
  });

  const { messageGroupStyles, messages: enrichedMessages } = useEnrichedMessages({
    channel,
    disableDateSeparator,
    headerPosition,
    hideDeletedMessages,
    hideNewMessageSeparator,
    messages,
    noGroupByUser,
    threadList,
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

  const finalInternalInfiniteScrollProps = useInternalInfiniteScrollProps(props);

  const messageListClass = customClasses?.messageList || 'str-chat__list';
  const threadListClass = threadList ? customClasses?.threadList || 'str-chat__list--thread' : '';

  return (
    <>
      <div className={`${messageListClass} ${threadListClass}`} onScroll={onScroll} ref={listRef}>
        {!elements.length ? (
          <EmptyStateIndicator listType='message' />
        ) : (
          <InfiniteScroll
            className='str-chat__reverse-infinite-scroll'
            data-testid='reverse-infinite-scroll'
            isReverse
            useWindow={false}
            {...finalInternalInfiniteScrollProps}
          >
            <ul className='str-chat__ul'>{elements}</ul>
            <TypingIndicator threadList={threadList} />
            <div key='bottom' />
          </InfiniteScroll>
        )}
      </div>
      <MessageListNotifications
        hasNewMessages={hasNewMessages}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottom}
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<Pick<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, PropsDrilledToMessage>> & {
  /** Disables the injection of date separator components, defaults to `false` */
  disableDateSeparator?: boolean;
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
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** The messages to render in the list, defaults to messages stored in [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { loadMore } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>('MessageList');

  const {
    members: membersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    mutes: mutesPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchers: watchersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...restChannelStateContext
  } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>('MessageList');

  return (
    <MessageListWithContext<At, Ch, Co, Ev, Me, Re, Us>
      loadMore={loadMore}
      {...restChannelStateContext}
      {...props}
    />
  );
};
