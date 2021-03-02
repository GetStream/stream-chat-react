import React, { useCallback, useContext, useMemo, useRef } from 'react';
import {
  Components,
  ScrollSeekConfiguration,
  ScrollSeekPlaceholderProps,
  Virtuoso,
  VirtuosoHandle,
} from 'react-virtuoso';
import type { MessageResponse, StreamChat } from 'stream-chat';
import type { EventComponentProps, TypingIndicatorProps } from 'types';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import { TranslationContext, useChannelContext } from '../../context';
import { smartRender } from '../../utils';
import {
  EmptyStateIndicator as DefaultEmptyStateIndicator,
  EmptyStateIndicatorProps,
} from '../EmptyStateIndicator';
import { EventComponent } from '../EventComponent';
import {
  LoadingIndicator as DefaultLoadingIndicator,
  LoadingIndicatorProps,
} from '../Loading';
import {
  FixedHeightMessage as DefaultMessage,
  MessageDeleted as DefaultMessageDeleted,
  FixedHeightMessageProps,
  MessageDeletedProps,
} from '../Message';
import { useNewMessageNotification } from './hooks/useNewMessageNotification';
import { usePrependedMessagesCount } from './hooks/usePrependMessagesCount';
import { useShouldForceScrollToBottom } from './hooks/useShouldForceScrollToBottom';
import { MessageNotification } from './MessageNotification';

export type VirtualizedMessageListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   *The client connection object for connecting to Stream
   * Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)
   */
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;

  /** Custom render function, if passed, certain UI props are ignored */
  customMessageRenderer(
    messageList: Array<MessageResponse<At, Ch, Co, Me, Re, Us>>,
    index: number,
  ): React.ReactElement;

  /** Available from [channel context](https://getstream.github.io/stream-chat-react/#channel) */
  hasMore: boolean;

  /** Available from [channel context](https://getstream.github.io/stream-chat-react/#channel) */
  loadingMore: boolean;

  /** The UI Indicator to use when MessageList or ChannelList is empty */
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps> | null;

  /** Component to render at the top of the MessageList while loading new messages */
  LoadingIndicator?: React.ComponentType<LoadingIndicatorProps>;

  /** Available from [channel context](https://getstream.github.io/stream-chat-react/#channel) */
  loadMore?(messageLimit?: number | undefined): Promise<number>;

  /** Custom UI component to display messages. */
  Message?: React.ElementType<FixedHeightMessageProps>;

  /** Custom UI component to display deleted messages. */
  MessageDeleted?: React.ElementType<MessageDeletedProps>;

  /** Set the limit to use when paginating messages */
  messageLimit?: number;

  /** Available from [channel context](https://getstream.github.io/stream-chat-react/#channel) */
  messages?: Array<MessageResponse<At, Ch, Co, Me, Re, Us>>;

  /** Custom UI component to display system messages */
  MessageSystem?: React.ElementType<EventComponentProps>;

  /** Causes the underlying list to render extra content in addition to the necessary one to fill in the visible viewport. */
  overscan?: number;

  /** Performance improvement by showing placeholders if user scrolls fast through list
   * it can be used like this:
   *  {
   *    enter: (velocity) => Math.abs(velocity) > 120,
   *    exit: (velocity) => Math.abs(velocity) < 40,
   *    change: () => null,
   *    placeholder: ({index, height})=> <div style={{height: height + "px"}}>{index}</div>,
   *  }
   *
   *  Note: virtuoso has broken out the placeholder value and instead includes it in its components prop.
   *  TODO: break out placeholder when making other breaking changes.
   */
  scrollSeekPlaceHolder?: ScrollSeekConfiguration & {
    placeholder: React.ComponentType<ScrollSeekPlaceholderProps>;
  };

  /**
   * Group messages belong to the same user if true, otherwise show each message individually, default to false
   * What it does is basically pass down a boolean prop named "groupedByUser" to Message component
   */
  shouldGroupByUser?: boolean;

  /**
   * The scrollTo Behavior when new messages appear. Use `"smooth"`
   * for regular chat channels, and `"auto"` (which results in instant scroll to bottom)
   * if you expect hight throughput.
   */
  stickToBottomScrollBehavior?: 'smooth' | 'auto';

  /** The UI Indicator to use when someone is typing, default to `null` */
  TypingIndicator?: React.ComponentType<TypingIndicatorProps> | null;
};

const PREPEND_OFFSET = 10 ** 7;

const VirtualizedMessageListWithoutContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  client,
  messages,
  loadMore,
  hasMore,
  loadingMore,
  messageLimit = 100,
  overscan = 0,
  shouldGroupByUser = false,
  customMessageRenderer,
  // TODO: refactor to scrollSeekPlaceHolderConfiguration and components.ScrollSeekPlaceholder, like the Virtuoso Component
  scrollSeekPlaceHolder,
  Message = DefaultMessage,
  MessageSystem = EventComponent,
  MessageDeleted = DefaultMessageDeleted,
  TypingIndicator = null,
  LoadingIndicator = DefaultLoadingIndicator,
  EmptyStateIndicator = DefaultEmptyStateIndicator,
  stickToBottomScrollBehavior = 'smooth',
}: VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { t } = useContext(TranslationContext);
  const virtuoso = useRef<VirtuosoHandle>(null);

  const {
    atBottom,
    newMessagesNotification,
    setNewMessagesNotification,
  } = useNewMessageNotification<At, Ch, Co, Me, Re, Us>(
    messages,
    client.userID,
  );

  const numItemsPrepended = usePrependedMessagesCount<At, Ch, Co, Me, Re, Us>(
    messages,
  );

  const shouldForceScrollToBottom = useShouldForceScrollToBottom<
    At,
    Ch,
    Co,
    Me,
    Re,
    Us
  >(messages, client.userID);

  const messageRenderer = useCallback(
    (messageList, virtuosoIndex) => {
      const streamMessageIndex =
        virtuosoIndex + numItemsPrepended - PREPEND_OFFSET;
      // use custom renderer supplied by client if present and skip the rest
      if (customMessageRenderer) {
        return customMessageRenderer(messageList, streamMessageIndex);
      }

      const message = messageList[streamMessageIndex];

      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.type === 'channel.event' || message.type === 'system') {
        return <MessageSystem message={message} />;
      }

      if (message.deleted_at) {
        return smartRender(MessageDeleted, { message }, null);
      }

      return (
        <Message
          groupedByUser={
            shouldGroupByUser &&
            streamMessageIndex > 0 &&
            message.user.id === messageList[streamMessageIndex - 1].user.id
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
      <div
        {...props}
        style={{
          display: 'inline-block',
          width: '100%',
        }}
      />
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

  if (!messages) {
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
          messages && messages.length > 0 ? messages.length - 1 : 0
        }
        itemContent={(i) => messageRenderer(messages, i)}
        overscan={overscan}
        ref={virtuoso}
        startReached={() => {
          if (hasMore && loadMore) {
            loadMore(messageLimit);
          }
        }}
        style={{ overflowX: 'hidden' }}
        totalCount={messages.length}
        {...(scrollSeekPlaceHolder
          ? { scrollSeek: scrollSeekPlaceHolder }
          : {})}
      />

      <div className='str-chat__list-notifications'>
        <MessageNotification
          onClick={() => {
            if (virtuoso.current) {
              virtuoso.current.scrollToIndex(messages.length - 1);
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
 * The VirtualizedMessageList component renders a list of messages in a virtual list.
 * It is a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 * @example ./VirtualizedMessageList.md
 */
export function VirtualizedMessageList<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(props: Partial<VirtualizedMessageListProps<At, Ch, Co, Ev, Me, Re, Us>>) {
  const context = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  return (
    <VirtualizedMessageListWithoutContext<At, Ch, Co, Ev, Me, Re, Us>
      client={context.client}
      hasMore={!!context.hasMore}
      loadingMore={!!context.loadingMore}
      loadMore={context.loadMore}
      // there's a mismatch in the created_at field - stream-chat MessageResponse says it's a string,
      // 'formatMessage' converts it to Date, which seems to be the correct type
      //@ts-expect-error
      messages={context.messages}
      {...props}
    />
  );
}
