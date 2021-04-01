import React, { useCallback, useMemo, useRef } from 'react';
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
import { MessageNotification } from './MessageNotification';
import { insertDates } from './utils';

import {
  DateSeparatorProps,
  DateSeparator as DefaultDateSeparator,
} from '../DateSeparator/DateSeparator';
import {
  EmptyStateIndicator as DefaultEmptyStateIndicator,
  EmptyStateIndicatorProps,
} from '../EmptyStateIndicator/EmptyStateIndicator';
import {
  EventComponent,
  EventComponentProps,
} from '../EventComponent/EventComponent';
import {
  LoadingIndicator as DefaultLoadingIndicator,
  LoadingIndicatorProps,
} from '../Loading/LoadingIndicator';
import {
  FixedHeightMessage as DefaultMessage,
  MessageDeleted as DefaultMessageDeleted,
  FixedHeightMessageProps,
  MessageDeletedProps,
} from '../Message';

import {
  StreamMessage,
  useChannelStateContext,
} from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Channel, StreamChat } from 'stream-chat';

import type { TypingIndicatorProps } from '../TypingIndicator/TypingIndicator';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type VirtualizedMessageListProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** The currently active channel */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   *The client connection object for connecting to Stream.
   * Available from [ChatContext](https://getstream.github.io/stream-chat-react/#section-chatcontext)
   */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  /** Custom render function, if passed, certain UI props are ignored */
  customMessageRenderer(
    messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
    index: number,
  ): React.ReactElement;
  /**
   * Date separator UI component to render
   * Defaults to and accepts same props as: [DateSeparator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/DateSeparator.tsx)
   */
  DateSeparator: React.ComponentType<DateSeparatorProps>;
  /** Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  hasMore: boolean;
  /** Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  loadingMore: boolean;
  /** Disables the injection of date separator components, defaults to `true` */
  disableDateSeparator?: boolean;
  /** The UI Indicator to use when MessageList or ChannelList is empty */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps> | null;
  /** Component to render at the top of the MessageList while loading new messages */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;
  /** Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  loadMore?: (messageLimit: number) => Promise<number>;
  /** Custom UI component to display messages */
  Message?: React.ComponentType<
    FixedHeightMessageProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Custom UI component to display deleted messages */
  MessageDeleted?: React.ComponentType<
    MessageDeletedProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /** Set the limit to use when paginating messages */
  messageLimit?: number;
  /** Available from [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext) */
  messages?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  /** Custom UI component to display system messages */
  MessageSystem?: React.ComponentType<
    EventComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
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
  /**
   * Group messages belong to the same user if true, otherwise show each message individually, defaults to `false`.
   * What it does is basically pass down a boolean prop named "groupedByUser" to Message component.
   */
  shouldGroupByUser?: boolean;
  /**
   * The scrollTo Behavior when new messages appear. Use ``"smooth"``
   * for regular chat channels, and `"auto"` (which results in instant scroll to bottom)
   * if you expect high throughput.
   */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';
  /** The UI Indicator to use when someone is typing, defaults to `null` */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps> | null;
};

const PREPEND_OFFSET = 10 ** 7;

const VirtualizedMessageListWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    client,
    customMessageRenderer,
    disableDateSeparator = true,
    DateSeparator = DefaultDateSeparator,
    EmptyStateIndicator = DefaultEmptyStateIndicator,
    hasMore,
    LoadingIndicator = DefaultLoadingIndicator,
    loadMore,
    loadingMore,
    Message = DefaultMessage,
    MessageDeleted = DefaultMessageDeleted,
    messageLimit = 100,
    messages,
    MessageSystem = EventComponent,
    overscan = 0,
    // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
    scrollSeekPlaceHolder,
    shouldGroupByUser = false,
    stickToBottomScrollBehavior = 'smooth',
    TypingIndicator = null,
  } = props;

  const { userID } = client;
  const lastRead = useMemo(() => channel.lastRead?.(), [channel]);

  const processedMessages = useMemo(() => {
    if (typeof messages === 'undefined') {
      return undefined;
    }
    return disableDateSeparator
      ? messages
      : insertDates(messages, lastRead, userID);
  }, [messages, lastRead, disableDateSeparator, userID, messages?.length]);

  const { t } = useTranslationContext();

  const virtuoso = useRef<VirtuosoHandle>(null);

  const {
    atBottom,
    newMessagesNotification,
    setNewMessagesNotification,
  } = useNewMessageNotification(processedMessages, client.userID);

  const numItemsPrepended = usePrependedMessagesCount(processedMessages);

  const shouldForceScrollToBottom = useShouldForceScrollToBottom(
    processedMessages,
    client.userID,
  );

  const messageRenderer = useCallback(
    (
      messageList: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
      virtuosoIndex: number,
    ) => {
      const streamMessageIndex =
        virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
      // use custom renderer supplied by client if present and skip the rest
      if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
      }

      const message = messageList[streamMessageIndex];

      if (message.type === 'message.date') {
        //@ts-expect-error
        return <DateSeparator date={message.date} unread={message.unread} />;
      }

      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.type === 'channel.event' || message.type === 'system') {
        return <MessageSystem message={message} />;
      }

      if (message.deleted_at) {
        return <MessageDeleted message={message} />;
      }

      return (
        <Message<At, Ch, Co, Ev, Me, Re, Us>
          groupedByUser={
            shouldGroupByUser &&
            streamMessageIndex > 0 &&
            message.user?.id === messageList[streamMessageIndex - 1].user?.id
          }
          message={message}
        />
      );
    },
    [
      MessageDeleted,
      customMessageRenderer,
      shouldGroupByUser,
      numItemsPrepended,
    ],
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

    // using 'display: inline-block' traps CSS margins of the item elements
    // preventing incorrect item measurements.
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
  }, [EmptyStateIndicator, loadingMore, TypingIndicator]);

  if (!processedMessages) {
    return null;
  }

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
          processedMessages && processedMessages.length > 0
            ? processedMessages.length - 1
            : 0
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
        {...(scrollSeekPlaceHolder
          ? { scrollSeek: scrollSeekPlaceHolder }
          : {})}
      />

      <div className='str-chat__list-notifications'>
        <MessageNotification
          onClick={() => {
            if (virtuoso.current) {
              virtuoso.current.scrollToIndex(processedMessages.length - 1);
            }
            setNewMessagesNotification(false);
          }}
          showNotification={newMessagesNotification}
        >
          {t('New Messages!')}
        </MessageNotification>
      </div>
    </div>
  );
};

/**
 * The VirtualizedMessageList component renders a list of Messages in a virtualized list.
 * It is a consumer of [ChannelContext](https://getstream.github.io/stream-chat-react/#section-channelcontext).
 *
 * **Note**: It works well when there are thousands of Messages in a Channel, it has a shortcoming though - the Message UI should have a fixed height.
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
>(props: Partial<VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>>) {
  const { channel, hasMore, loadingMore, messages } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  return (
    // @ts-expect-error TODO: check if props need to be Partial
    <VirtualizedMessageListWithContext
      channel={channel}
      client={client}
      hasMore={!!hasMore}
      loadingMore={!!loadingMore}
      // @ts-expect-error
      loadMore={loadMore}
      // there's a mismatch in the created_at field - stream-chat MessageResponse says it's a string,
      // 'formatMessage' converts it to Date, which seems to be the correct type
      messages={messages}
      {...props}
    />
  );
}
