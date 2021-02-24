import React, { useCallback, useContext, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { ChannelContext, TranslationContext } from '../../context';
import { smartRender } from '../../utils';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import {
  FixedHeightMessage as DefaultMessage,
  MessageDeleted as DefaultMessageDeleted,
} from '../Message';
import { useNewMessageNotification } from './hooks/useNewMessageNotification';
import { usePrependedMessagesCount } from './hooks/usePrependMessagesCount';
import { useShouldForceScrollToBottom } from './hooks/useShouldForceScrollToBottom';
import MessageNotification from './MessageNotification';

const PREPEND_OFFSET = 10 ** 7;

/**
 * VirtualizedMessageList - This component renders a list of messages in a virtual list. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 * @example ../../docs/VirtualizedMessageList.md
 * @type {React.FC<import('types').VirtualizedMessageListInternalProps>}
 */
const VirtualizedMessageList = ({
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
}) => {
  const { t } = useContext(TranslationContext);

  const virtuoso = useRef(
    /** @type {import('react-virtuoso').VirtuosoHandle | undefined} */ (undefined),
  );

  const {
    atBottom,
    newMessagesNotification,
    setNewMessagesNotification,
  } = useNewMessageNotification(messages, client.userID);

  const numItemsPrepended = usePrependedMessagesCount(messages);

  const shouldForceScrollToBottom = useShouldForceScrollToBottom(
    messages,
    client.userID,
  );

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
    const EmptyPlaceholder = () => <EmptyStateIndicator listType='message' />;
    const Header = () =>
      loadingMore ? (
        <div className='str-chat__virtual-list__loading'>
          <LoadingIndicator size={20} />
        </div>
      ) : (
        <></>
      );

    /**
     * using 'display: inline-block' traps CSS margins of the item elements, preventing incorrect item measurements.
     * @type {import('react-virtuoso').Components['Item']}
     */
    const Item = (props) => (
      <div
        {...props}
        style={{
          display: 'inline-block',
          width: '100%',
        }}
      />
    );

    const Footer = () =>
      TypingIndicator ? <TypingIndicator avatarSize={24} /> : <></>;

    return {
      EmptyPlaceholder,
      Footer,
      Header,
      Item,
    };
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
        // @ts-expect-error
        ref={virtuoso}
        startReached={() => {
          if (hasMore) {
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

// TODO: fix the types here when everything converted to proper TS
/**
 * @param {import("types").VirtualizedMessageListProps} props
 * @returns {React.ElementType<import("types").VirtualizedMessageListInternalProps>}
 */
export default function VirtualizedMessageListWithContext(props) {
  // @ts-expect-error
  return (
    <ChannelContext.Consumer>
      {(
        /* {Required<Pick<import('types').ChannelContextValue, 'client' | 'messages' | 'loadMore' | 'hasMore'>>} */ context,
      ) => (
        <VirtualizedMessageList
          client={context.client}
          // @ts-expect-error
          hasMore={context.hasMore}
          // @ts-expect-error
          loadingMore={context.loadingMore}
          // @ts-expect-error
          loadMore={context.loadMore}
          // @ts-expect-error
          messages={context.messages}
          {...props}
        />
      )}
    </ChannelContext.Consumer>
  );
}
