import React from 'react';

import { useCallLoadMore } from './hooks/useCallLoadMore';
import { useEnrichedMessages } from './hooks/useEnrichedMessages';
import { useMessageListElements } from './hooks/useMessageListElements';
import { useScrollLocationLogic } from './hooks/useScrollLocationLogic';

import { Center } from './Center';
import { ConnectionStatus } from './ConnectionStatus';
import { CustomNotification } from './CustomNotification';
import { MessageNotification } from './MessageNotification';

import {
  ChannelActionContextValue,
  useChannelActionContext,
} from '../../context/ChannelActionContext';
import {
  ChannelNotifications,
  ChannelStateContextValue,
  useChannelStateContext,
} from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { InfiniteScroll, InfiniteScrollProps } from '../InfiniteScrollPaginator';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import { TypingIndicator as DefaultTypingIndicator } from '../TypingIndicator';

import type { StreamChat } from 'stream-chat';

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
} from '../../../types/types';

type MessageListNotificationsProps = {
  hasNewMessages: boolean;
  notifications: ChannelNotifications;
  scrollToBottom: () => void;
};

const MessageListNotifications = ({
  hasNewMessages,
  notifications,
  scrollToBottom,
}: MessageListNotificationsProps) => {
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__list-notifications'>
      {notifications.map((notification) => (
        <CustomNotification active={true} key={notification.id} type={notification.type}>
          {notification.text}
        </CustomNotification>
      ))}
      <ConnectionStatus />
      <MessageNotification onClick={scrollToBottom} showNotification={hasNewMessages}>
        {t('New Messages!')}
      </MessageNotification>
    </div>
  );
};

const useInternalInfiniteScrollProps = (
  props: Pick<
    MessageListWithContextProps,
    'hasMore' | 'internalInfiniteScrollProps' | 'loadMore' | 'loadingMore' | 'messageLimit'
  >,
) => {
  const { LoadingIndicator = DefaultLoadingIndicator } = useComponentContext();

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
> = Omit<ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'members' | 'watchers'> &
  MessageListProps<At, Ch, Co, Ev, Me, Re, Us> & {
    client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  };

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
    client,
    disableDateSeparator = false,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    messages = [],
    notifications,
    noGroupByUser = false,
    pinPermissions = defaultPinPermissions,
    threadList = false,
    unsafeHTML = false,
    headerPosition,
    read,
  } = props;

  const {
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    TypingIndicator = DefaultTypingIndicator,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    hasNewMessages,
    onMessageLoadCaptured,
    onScroll,
    ref,
    scrollToBottom,
    wrapperRect,
  } = useScrollLocationLogic({
    currentUserId: client.userID,
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
      customMessageActions: props.customMessageActions,
      formatDate: props.formatDate,
      getFlagMessageErrorNotification: props.getFlagMessageErrorNotification,
      getFlagMessageSuccessNotification: props.getFlagMessageSuccessNotification,
      getMuteUserErrorNotification: props.getMuteUserErrorNotification,
      getMuteUserSuccessNotification: props.getMuteUserSuccessNotification,
      getPinMessageErrorNotification: props.getPinMessageErrorNotification,
      Message: props.Message,
      messageActions,
      messageListRect: wrapperRect,
      mutes: props.mutes,
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
    threadList,
  });

  const finalInternalInfiniteScrollProps = useInternalInfiniteScrollProps(props);

  return (
    <>
      <div
        className={`str-chat__list ${props.threadList ? 'str-chat__list--thread' : ''}`}
        onScroll={onScroll}
        ref={ref}
      >
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
        notifications={notifications}
        scrollToBottom={scrollToBottom}
      />
    </>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'customMessageActions'
  | 'formatDate'
  | 'getFlagMessageErrorNotification'
  | 'getFlagMessageSuccessNotification'
  | 'getMuteUserErrorNotification'
  | 'getMuteUserSuccessNotification'
  | 'getPinMessageErrorNotification'
  | 'Message'
  | 'messageActions'
  | 'onMentionsClick'
  | 'onMentionsHover'
  | 'onUserClick'
  | 'onUserHover'
  | 'openThread'
  | 'pinPermissions'
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
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** The messages to render in the list, defaults to messages stored in [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  /** Set to `true` to turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** The pixel threshold to determine whether or not the user is scrolled up in the list, defaults to 200px */
  scrolledUpThreshold?: number;
  /** Set to `true` to indicate that the list is a thread  */
  threadList?: boolean;
};

/**
 * The MessageList component renders a list of Messages.
 * It is a consumer of the following contexts:
 * - [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext)
 * - [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext)
 * - [ComponentContext](https://getstream.github.io/stream-chat-react/#section-componentcontext)
 * - [TypingContext](https://getstream.github.io/stream-chat-react/#section-typingcontext)
 * @example ./MessageList.md
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
  const { loadMore } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    members: membersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchers: watchersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...restChannelStateContext
  } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    <MessageListWithContext<At, Ch, Co, Ev, Me, Re, Us>
      client={client}
      loadMore={loadMore}
      {...restChannelStateContext}
      {...props}
    />
  );
};
