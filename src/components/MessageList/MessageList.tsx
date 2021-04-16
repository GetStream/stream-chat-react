import React, { useMemo } from 'react';

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
import { ComponentContextValue, ComponentProvider } from '../../context/ComponentContext';
import { TranslationContextValue, useTranslationContext } from '../../context/TranslationContext';
import {
  EmptyStateIndicator as DefaultEmptyStateIndicator,
  EmptyStateIndicatorProps,
} from '../EmptyStateIndicator';
import { InfiniteScroll, InfiniteScrollProps } from '../InfiniteScrollPaginator';
import { LoadingIndicator as DefaultLoadingIndicator, LoadingIndicatorProps } from '../Loading';
import { defaultPinPermissions, MESSAGE_ACTIONS } from '../Message/utils';
import {
  TypingIndicator as DefaultTypingIndicator,
  TypingIndicatorProps,
} from '../TypingIndicator';

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
  t: TranslationContextValue['t'];
};

const MessageListNotifications = ({
  hasNewMessages,
  notifications,
  scrollToBottom,
  t,
}: MessageListNotificationsProps) => (
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

const useInternalInfiniteScrollProps = (
  props: Pick<
    MessageListWithContextProps,
    | 'hasMore'
    | 'internalInfiniteScrollProps'
    | 'loadMore'
    | 'LoadingIndicator'
    | 'loadingMore'
    | 'messageLimit'
  >,
) => {
  const { LoadingIndicator = DefaultLoadingIndicator } = props;

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

type MessageListPropsToOmit =
  | 'Attachment'
  | 'Avatar'
  | 'DateSeparator'
  | 'EditMessageInput'
  | 'HeaderComponent'
  | 'Message'
  | 'MessageDeleted'
  | 'MessageSystem'
  | 'PinIndicator';

type MessageListWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<ChannelStateContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'members' | 'watchers'> &
  Omit<MessageListProps<At, Ch, Co, Ev, Me, Re, Us>, MessageListPropsToOmit> &
  TranslationContextValue & {
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
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    messages = [],
    notifications,
    noGroupByUser = false,
    pinPermissions = defaultPinPermissions,
    t,
    threadList = false,
    TypingIndicator = DefaultTypingIndicator,
    unsafeHTML = false,
    headerPosition,
    read,
  } = props;

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
      channel,
      customMessageActions: props.customMessageActions,
      getFlagMessageErrorNotification: props.getFlagMessageErrorNotification,
      getFlagMessageSuccessNotification: props.getFlagMessageSuccessNotification,
      getMuteUserErrorNotification: props.getMuteUserErrorNotification,
      getMuteUserSuccessNotification: props.getMuteUserSuccessNotification,
      getPinMessageErrorNotification: props.getPinMessageErrorNotification,
      messageActions,
      messageListRect: wrapperRect,
      mutes: props.mutes,
      onMentionsClick: props.onMentionsClick,
      onMentionsHover: props.onMentionsHover,
      onUserClick: props.onUserClick,
      onUserHover: props.onUserHover,
      openThread: props.openThread,
      pinPermissions,
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
        t={t}
      />
    </>
  );
};

type PropsDrilledToMessage =
  | 'additionalMessageInputProps'
  | 'customMessageActions'
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
  /** UI component to display an attachment on a message, overrides value in [ComponentContext](https://getstream.github.io/stream-chat-react/#section-componentcontext) */
  Attachment?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Attachment'];
  /** UI component to display a user's avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['Avatar'];
  /** Custom UI component for date separators, defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx) */
  DateSeparator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['DateSeparator'];
  /** Disables the injection of date separator components, defaults to `false` */
  disableDateSeparator?: boolean;
  /** Custom UI component to override default edit message input, defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.tsx) */
  EditMessageInput?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['EditMessageInput'];
  /** The UI Indicator to use when `MessageList` or `ChannelList` is empty  */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  /** Whether or not the list has more items to load */
  hasMore?: boolean;
  /** Component to render at the top of the MessageList */
  HeaderComponent?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['HeaderComponent'];
  /** Position to render HeaderComponent */
  headerPosition?: number;
  /** Hides the MessageDeleted components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  /** Hides the DateSeparator component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** Overrides the default props passed to [InfiniteScroll](https://github.com/GetStream/stream-chat-react/blob/master/src/components/InfiniteScrollPaginator/InfiniteScroll.tsx) */
  internalInfiniteScrollProps?: InfiniteScrollProps;
  /** Component to render at the top of the MessageList while loading new messages */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** Custom UI component for a deleted message, defaults to and accepts same props as: [MessageDeleted](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageDeleted.tsx) */
  MessageDeleted?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageDeleted'];
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** Custom UI component for message options popup, defaults to and accepts same props as: [MessageOptions](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageOptions.tsx) */
  MessageOptions?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageOptions'];
  /** Custom UI component to display message replies, defaults to and accepts same props as: [MessageRepliesCountButton](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageRepliesCountButton.tsx) */
  MessageRepliesCountButton?: ComponentContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['MessageRepliesCountButton'];
  /** The messages to render in the list, defaults to messages stored in [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  /** Custom UI component to display system messages, defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.tsx) */
  MessageSystem?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageSystem'];
  /** Custom UI component to display a timestamp on a message, defaults to and accepts same props as: [MessageTimestamp](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/MessageTimestamp.tsx) */
  MessageTimestamp?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['MessageTimestamp'];
  /** Set to `true` to turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** Custom UI component to override default pinned message indicator, defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icons.tsx) */
  PinIndicator?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['PinIndicator'];
  /** Custom UI component to display the reaction selector, defaults to and accepts same props as: [ReactionSelector](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionSelector.tsx) */
  ReactionSelector?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ReactionSelector'];
  /** Custom UI component to display the list of reactions on a message, defaults to and accepts same props as: [ReactionsList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Reactions/ReactionsList.tsx) */
  ReactionsList?: ComponentContextValue<At, Ch, Co, Ev, Me, Re, Us>['ReactionsList'];
  /** The pixel threshold to determine whether or not the user is scrolled up in the list, defaults to 200px */
  scrolledUpThreshold?: number;
  /** Set to `true` to indicate that the list is a thread  */
  threadList?: boolean;
  /** Custom UI component for the typing indicator, defaults to and accepts same props as: [TypingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/TypingIndicator/TypingIndicator.tsx) */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps>;
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
  const {
    Attachment,
    Avatar,
    DateSeparator,
    EditMessageInput,
    HeaderComponent,
    Message,
    MessageDeleted,
    MessageOptions,
    MessageRepliesCountButton,
    MessageSystem,
    MessageTimestamp,
    PinIndicator,
    ReactionSelector,
    ReactionsList,
    ...rest
  } = props;

  const { loadMore } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    members: membersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    watchers: watchersPropToNotPass, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...restChannelStateContext
  } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const translationContext = useTranslationContext();

  const updatedComponentContext = useMemo(
    () => ({
      Attachment,
      Avatar,
      DateSeparator,
      EditMessageInput,
      HeaderComponent,
      Message,
      MessageDeleted,
      MessageOptions,
      MessageRepliesCountButton,
      MessageSystem,
      MessageTimestamp,
      PinIndicator,
      ReactionSelector,
      ReactionsList,
    }),
    [Message],
  );

  return (
    <ComponentProvider value={updatedComponentContext}>
      <MessageListWithContext
        client={client}
        loadMore={loadMore}
        {...restChannelStateContext}
        {...translationContext}
        {...rest}
      />
    </ComponentProvider>
  );
};
