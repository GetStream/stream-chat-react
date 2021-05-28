import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Components,
  ScrollSeekConfiguration,
  ScrollSeekPlaceholderProps,
  Virtuoso,
  VirtuosoHandle,
} from 'react-virtuoso';

import { useNewMessageNotification } from './hooks/useNewMessageNotification';
import { usePrependedMessagesCount } from './hooks/usePrependMessagesCount';
import { useShouldForceScrollToBottom } from './hooks/useShouldForceScrollToBottom';
import { MessageNotification as DefaultMessageNotification } from './MessageNotification';
import { processMessages } from './utils';

import { DateSeparator as DefaultDateSeparator } from '../DateSeparator/DateSeparator';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator/EmptyStateIndicator';
import { EventComponent } from '../EventComponent/EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading/LoadingIndicator';
import { FixedHeightMessage, FixedHeightMessageProps } from '../Message/FixedHeightMessage';
import { Message } from '../Message/Message';

import {
  ChannelActionContextValue,
  useChannelActionContext,
} from '../../context/ChannelActionContext';
import { StreamMessage, useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { isDate, useTranslationContext } from '../../context/TranslationContext';

import type { Channel, StreamChat } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
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
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  hasMore: boolean;
  loadingMore: boolean;
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
    channel,
    client,
    customMessageRenderer,
    disableDateSeparator = true,
    hasMore,
    hideDeletedMessages = false,
    hideNewMessageSeparator = false,
    loadingMore,
    loadMore,
    Message: propMessage,
    messageLimit = 100,
    messages,
    overscan = 0,
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    scrollSeekPlaceHolder,
    scrollToLatestMessageOnFocus = false,
    shouldGroupByUser = false,
    stickToBottomScrollBehavior = 'smooth',
  } = props;

  const {
    DateSeparator = DefaultDateSeparator,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
    MessageNotification = DefaultMessageNotification,
    MessageSystem = EventComponent,
    TypingIndicator = null,
    VirtualMessage: contextMessage = FixedHeightMessage,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { t } = useTranslationContext();

  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const MessageUIComponent = propMessage || contextMessage;

  const processedMessages = useMemo(() => {
    if (typeof messages === 'undefined') {
      return [];
    }

    if (disableDateSeparator && !hideDeletedMessages && hideNewMessageSeparator) {
      return messages;
    }

    return processMessages(
      messages,
      lastRead,
      client.userID,
      hideDeletedMessages,
      disableDateSeparator,
      hideNewMessageSeparator,
    );
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

  const messageRenderer = useCallback(
    (messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[], virtuosoIndex: number) => {
      const streamMessageIndex = virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
      // use custom renderer supplied by client if present and skip the rest
      if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
      }

      const message = messageList[streamMessageIndex];

      if (message.type === 'message.date' && message.date && isDate(message.date)) {
        return <DateSeparator date={message.date} unread={message.unread} />;
      }

      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.type === 'channel.event' || message.type === 'system') {
        return <MessageSystem message={message} />;
      }

      return (
        <Message
          message={message}
          Message={() => (
            <MessageUIComponent
              groupedByUser={
                shouldGroupByUser &&
                streamMessageIndex > 0 &&
                message.user?.id === messageList[streamMessageIndex - 1].user?.id
              }
            />
          )}
        />
      );
    },
    [customMessageRenderer, shouldGroupByUser, numItemsPrepended],
  );

  const virtuosoComponents = useMemo(() => {
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

    // using 'display: inline-block' traps CSS margins of the item elements, preventing incorrect item measurements
    const Item: Components['Item'] = (props) => (
      <div {...props} className='str-chat__virtual-list-message-wrapper' />
    );

    const Footer: Components['Footer'] = () =>
      TypingIndicator ? <TypingIndicator avatarSize={24} /> : <></>;

    return {
      EmptyPlaceholder,
      Footer,
      Header,
      Item,
    } as Partial<Components>;
  }, [loadingMore]);

  if (!processedMessages) return null;

  return (
    <div className='str-chat__virtual-list'>
      <Virtuoso
        atBottomStateChange={(isAtBottom) => {
          atBottom.current = isAtBottom;
          if (isAtBottom && newMessagesNotification) {
            setNewMessagesNotification(false);
          }
        }}
        components={virtuosoComponents}
        firstItemIndex={PREPEND_OFFSET - numItemsPrepended}
        followOutput={(isAtBottom) => {
          if (shouldForceScrollToBottom()) {
            return isAtBottom ? stickToBottomScrollBehavior : 'auto';
          }
          // a message from another user has been received - don't scroll to bottom unless already there
          return isAtBottom ? stickToBottomScrollBehavior : false;
        }}
        initialTopMostItemIndex={
          processedMessages && processedMessages.length > 0 ? processedMessages.length - 1 : 0
        }
        itemContent={(i) => messageRenderer(processedMessages, i)}
        overscan={overscan}
        ref={virtuoso}
        startReached={() => {
          if (hasMore && loadMore) {
            loadMore(messageLimit);
          }
        }}
        style={{ overflowX: 'hidden' }}
        totalCount={processedMessages.length}
        {...(scrollSeekPlaceHolder ? { scrollSeek: scrollSeekPlaceHolder } : {})}
      />
      <div className='str-chat__list-notifications'>
        <MessageNotification onClick={scrollToBottom} showNotification={newMessagesNotification}>
          {t('New Messages!')}
        </MessageNotification>
      </div>
    </div>
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
> = {
  /** Custom render function, if passed, certain UI props are ignored */
  customMessageRenderer?: (
    messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
    index: number,
  ) => React.ReactElement;
  /** Disables the injection of date separator components, defaults to `true` */
  disableDateSeparator?: boolean;
  /** Hides the `MessageDeleted` components from the list, defaults to `false` */
  hideDeletedMessages?: boolean;
  /** Hides the `DateSeparator` component when new messages are received in a channel that's watched but not active, defaults to false */
  hideNewMessageSeparator?: boolean;
  /** Function called when more messages are to be loaded, defaults to function stored in [ChannelActionContext](https://getstream.github.io/stream-chat-react/#section-channelactioncontext) */
  loadMore?: ChannelActionContextValue['loadMore'];
  /** Custom UI component to display a message, defaults to and accepts same props as [FixedHeightMessage](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/FixedHeightMessage.tsx) */
  Message?: React.ComponentType<FixedHeightMessageProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Set the limit to use when paginating messages */
  messageLimit?: number;
  /** Optional prop to override the messages available from [ChannelStateContext](https://getstream.github.io/stream-chat-react/#section-channelstatecontext) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  /** Causes the underlying list to render extra content in addition to the necessary one to fill in the visible viewport */
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
  /**
   * Group messages belong to the same user if true, otherwise show each message individually, defaults to `false`.
   * What it does is basically pass down a boolean prop named "groupedByUser" to Message component.
   */
  shouldGroupByUser?: boolean;
  /**
   * The scrollTo behavior when new messages appear. Use `"smooth"`
   * for regular chat channels, and `"auto"` (which results in instant scroll to bottom)
   * if you expect high throughput.
   */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
};

/**
 * The VirtualizedMessageList component renders a list of messages in a virtualized list.
 * It is a consumer of the React contexts set in [Channel](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Channel/Channel.tsx).
 *
 * **Note**: It works well when there are thousands of messages in a channel, it has a shortcoming though - the message UI should have a fixed height.
 * @example ./VirtualizedMessageList.md
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
  const { loadMore } = useChannelActionContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel, hasMore, loadingMore, messages: contextMessages } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const messages = props.messages || contextMessages;

  return (
    <VirtualizedMessageListWithContext
      channel={channel}
      client={client}
      hasMore={!!hasMore}
      loadingMore={!!loadingMore}
      loadMore={loadMore}
      messages={messages}
      {...props}
    />
  );
}
