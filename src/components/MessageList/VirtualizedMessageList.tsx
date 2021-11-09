import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Components,
  ScrollSeekConfiguration,
  ScrollSeekPlaceholderProps,
  Virtuoso,
  VirtuosoHandle,
  VirtuosoProps,
} from 'react-virtuoso';

import { GiphyPreviewMessage as DefaultGiphyPreviewMessage } from './GiphyPreviewMessage';
import { useGiphyPreview } from './hooks/useGiphyPreview';
import { useNewMessageNotification } from './hooks/useNewMessageNotification';
import { usePrependedMessagesCount } from './hooks/usePrependMessagesCount';
import { useShouldForceScrollToBottom } from './hooks/useShouldForceScrollToBottom';
import { MessageNotification as DefaultMessageNotification } from './MessageNotification';
import { MessageListNotifications as DefaultMessageListNotifications } from './MessageListNotifications';
import { processMessages } from './utils';

import { DateSeparator as DefaultDateSeparator } from '../DateSeparator/DateSeparator';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator/EmptyStateIndicator';
import { EventComponent } from '../EventComponent/EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';
import { Message, MessageProps, MessageSimple, MessageUIComponentProps } from '../Message';

import {
  ChannelActionContextValue,
  useChannelActionContext,
} from '../../context/ChannelActionContext';
import {
  ChannelNotifications,
  StreamMessage,
  useChannelStateContext,
} from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { isDate } from '../../context/TranslationContext';

import type { Channel } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

const PREPEND_OFFSET = 10 ** 7;

type VirtualizedMessageListWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us> & {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  hasMore: boolean;
  loadingMore: boolean;
  notifications: ChannelNotifications;
};

const VirtualizedMessageListWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: VirtualizedMessageListWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalVirtuosoProps,
    channel,
    closeReactionSelectorOnClick,
    customMessageRenderer,
    defaultItemHeight,
    disableDateSeparator = true,
    hasMore,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    loadingMore,
    loadMore,
    Message: propMessage,
    messageLimit = 100,
    messages,
    notifications,
    overscan = 0,
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    scrollSeekPlaceHolder,
    scrollToLatestMessageOnFocus = false,
    separateGiphyPreview = false,
    shouldGroupByUser = false,
    stickToBottomScrollBehavior = 'smooth',
  } = props;

  const {
    DateSeparator = DefaultDateSeparator,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    GiphyPreviewMessage = DefaultGiphyPreviewMessage,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageListNotifications = DefaultMessageListNotifications,
    MessageNotification = DefaultMessageNotification,
    MessageSystem = EventComponent,
    TypingIndicator = null,
    VirtualMessage: contextMessage = MessageSimple,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('VirtualizedMessageList');

  const { client, customClasses } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>(
    'VirtualizedMessageList',
  );

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const MessageUIComponent = propMessage || contextMessage;

  const { giphyPreviewMessage, setGiphyPreviewMessage } = useGiphyPreview<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >(separateGiphyPreview);

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
      disableDateSeparator,
      hideDeletedMessages,
      hideNewMessageSeparator,
      lastRead,
      messages,
      separateGiphyPreview,
      setGiphyPreviewMessage,
      userId: client.userID || '',
    });
  }, [
    disableDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    messages,
    messages?.length,
    client.userID,
  ]);

  const virtuoso = useRef<VirtuosoHandle>(null);

  const {
    atBottom,
    newMessagesNotification,
    setNewMessagesNotification,
  } = useNewMessageNotification(processedMessages, client.userID);

  const scrollToBottom = useCallback(() => {
    if (virtuoso.current) {
      virtuoso.current.scrollToIndex(processedMessages.length - 1);
    }

    setNewMessagesNotification(false);
  }, [virtuoso, processedMessages, setNewMessagesNotification, processedMessages.length]);

  const scrollToBottomIfConfigured = useCallback(
    (event: Event) => {
      if (scrollToLatestMessageOnFocus && event.target === window) {
        setTimeout(scrollToBottom, 100);
      }
    },
    [scrollToLatestMessageOnFocus, scrollToBottom],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', scrollToBottomIfConfigured);
    }

    return () => window.removeEventListener('focus', scrollToBottomIfConfigured);
  }, [scrollToBottomIfConfigured]);

  const numItemsPrepended = usePrependedMessagesCount(processedMessages);

  const shouldForceScrollToBottom = useShouldForceScrollToBottom(processedMessages, client.userID);

  const followOutput = (isAtBottom: boolean) => {
    if (shouldForceScrollToBottom()) {
      return isAtBottom ? stickToBottomScrollBehavior : 'auto';
    }
    // a message from another user has been received - don't scroll to bottom unless already there
    return isAtBottom ? stickToBottomScrollBehavior : false;
  };

  const messageRenderer = useCallback(
    (messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[], virtuosoIndex: number) => {
      const streamMessageIndex = virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
      // use custom renderer supplied by client if present and skip the rest
      if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
      }

      const message = messageList[streamMessageIndex];

      if (message.customType === 'message.date' && message.date && isDate(message.date)) {
        return <DateSeparator date={message.date} unread={message.unread} />;
      }

      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.type === 'system') {
        return <MessageSystem message={message} />;
      }

      const groupedByUser =
        shouldGroupByUser &&
        streamMessageIndex > 0 &&
        message.user?.id === messageList[streamMessageIndex - 1].user?.id;

      const firstOfGroup =
        shouldGroupByUser &&
        streamMessageIndex > 0 &&
        message.user?.id !== messageList[streamMessageIndex - 1]?.user?.id;

      const endOfGroup =
        shouldGroupByUser &&
        streamMessageIndex > 0 &&
        message.user?.id !== messageList[streamMessageIndex + 1]?.user?.id;

      return (
        <Message
          closeReactionSelectorOnClick={closeReactionSelectorOnClick}
          customMessageActions={props.customMessageActions}
          endOfGroup={endOfGroup}
          firstOfGroup={firstOfGroup}
          groupedByUser={groupedByUser}
          message={message}
          Message={MessageUIComponent}
          messageActions={props.messageActions}
        />
      );
    },
    [customMessageRenderer, shouldGroupByUser, numItemsPrepended],
  );

  const virtuosoComponents: Partial<Components> = useMemo(() => {
    const EmptyPlaceholder: Components['EmptyPlaceholder'] = () => (
      <>{EmptyStateIndicator && <EmptyStateIndicator listType='message' />}</>
    );

    const Header: Components['Header'] = () =>
      loadingMore ? (
        <div className='str-chat__virtual-list__loading'>
          <LoadingIndicator size={20} />
        </div>
      ) : (
        <></>
      );

    const virtualMessageClass =
      customClasses?.virtualMessage || 'str-chat__virtual-list-message-wrapper';

    // using 'display: inline-block' traps CSS margins of the item elements, preventing incorrect item measurements
    const Item: Components['Item'] = (props) => <div {...props} className={virtualMessageClass} />;

    const Footer: Components['Footer'] = () =>
      TypingIndicator ? <TypingIndicator avatarSize={24} /> : <></>;

    return {
      EmptyPlaceholder,
      Footer,
      Header,
      Item,
    };
  }, [loadingMore]);

  const atBottomStateChange = (isAtBottom: boolean) => {
    atBottom.current = isAtBottom;
    if (isAtBottom && newMessagesNotification) {
      setNewMessagesNotification(false);
    }
  };

  const startReached = () => {
    if (hasMore && loadMore) {
      loadMore(messageLimit);
    }
  };

  if (!processedMessages) return null;

  const virtualizedMessageListClass =
    customClasses?.virtualizedMessageList || 'str-chat__virtual-list';

  return (
    <>
      <div className={virtualizedMessageListClass}>
        <Virtuoso
          atBottomStateChange={atBottomStateChange}
          components={virtuosoComponents}
          firstItemIndex={PREPEND_OFFSET - numItemsPrepended}
          followOutput={followOutput}
          initialTopMostItemIndex={processedMessages.length ? processedMessages.length - 1 : 0}
          itemContent={(i) => messageRenderer(processedMessages, i)}
          overscan={overscan}
          ref={virtuoso}
          startReached={startReached}
          style={{ overflowX: 'hidden' }}
          totalCount={processedMessages.length}
          {...additionalVirtuosoProps}
          {...(scrollSeekPlaceHolder ? { scrollSeek: scrollSeekPlaceHolder } : {})}
          {...(defaultItemHeight ? { defaultItemHeight } : {})}
        />
      </div>
      <MessageListNotifications
        hasNewMessages={newMessagesNotification}
        MessageNotification={MessageNotification}
        notifications={notifications}
        scrollToBottom={scrollToBottom}
      />
      {giphyPreviewMessage && <GiphyPreviewMessage message={giphyPreviewMessage} />}
    </>
  );
};

export type VirtualizedMessageListProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Partial<
  Pick<MessageProps<At, Ch, Co, Ev, Me, Re, Us>, 'customMessageActions' | 'messageActions'>
> & {
  /** Additional props to be passed the underlying [`react-virtuoso` virtualized list dependency](https://virtuoso.dev/virtuoso-api-reference/) */
  additionalVirtuosoProps?: VirtuosoProps<UnknownType>;
  /** If true, picking a reaction from the `ReactionSelector` component will close the selector */
  closeReactionSelectorOnClick?: boolean;
  /** Custom render function, if passed, certain UI props are ignored */
  customMessageRenderer?: (
    messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
    index: number,
  ) => React.ReactElement;
  /** If set, the default item height is used for the calculation of the total list height. Use if you expect messages with a lot of height variance */
  defaultItemHeight?: number;
  /** Disables the injection of date separator components, defaults to `true` */
  disableDateSeparator?: boolean;
  /** Whether or not the list has more items to load */
  hasMore?: boolean;
  /** Hides the `MessageDeleted` components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  /** Hides the `DateSeparator` component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** Whether or not the list is currently loading more items */
  loadingMore?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_action_context/) */
  loadMore?: ChannelActionContextValue['loadMore'] | (() => Promise<void>);
  /** Custom UI component to display a message, defaults to and accepts same props as [FixedHeightMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/FixedHeightMessage.tsx) */
  Message?: React.ComponentType<MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** The limit to use when paginating messages */
  messageLimit?: number;
  /** Optional prop to override the messages available from [ChannelStateContext](https://getstream.io/chat/docs/sdk/react/contexts/channel_state_context/) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  /** The amount of extra content the list should render in addition to what's necessary to fill in the viewport */
  overscan?: number;
  /**
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
  /** The scrollTo behavior when new messages appear. Use `"smooth"` for regular chat channels, and `"auto"` (which results in instant scroll to bottom) if you expect high throughput. */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
  /** If true, indicates the message list is a thread  */
  threadList?: boolean;
};

/**
 * The VirtualizedMessageList component renders a list of messages in a virtualized list.
 * It is a consumer of the React contexts set in [Channel](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Channel/Channel.tsx).
 *
 * **Note**: It works well when there are thousands of messages in a channel, it has a shortcoming though - the message UI should have a fixed height.
 */
export function VirtualizedMessageList<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(props: VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>) {
  const { loadMore } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>(
    'VirtualizedMessageList',
  );
  const {
    channel,
    hasMore,
    loadingMore,
    messages: contextMessages,
    notifications,
  } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>('VirtualizedMessageList');

  const messages = props.messages || contextMessages;

  return (
    <VirtualizedMessageListWithContext
      channel={channel}
      hasMore={!!hasMore}
      loadingMore={!!loadingMore}
      loadMore={loadMore}
      messages={messages}
      notifications={notifications}
      {...props}
    />
  );
}
