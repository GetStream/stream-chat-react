// @ts-check
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Virtuoso } from 'react-virtuoso';

import { smartRender } from '../../utils';
import MessageNotification from './MessageNotification';
import { ChannelContext, TranslationContext } from '../../context';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import {
  MessageDeleted as DefaultMessageDeleted,
  FixedHeightMessage,
} from '../Message';

/**
 * VirtualizedMessageList - This component renders a list of messages in a virtual list. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 * It is pretty fast for rendering thousands of messages but it needs its Message component to have fixed height
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
  overscan = 200,
  shouldGroupByUser = false,
  customMessageRenderer,
  scrollSeekPlaceHolder,
  Message = FixedHeightMessage,
  MessageSystem = EventComponent,
  MessageDeleted = DefaultMessageDeleted,
  TypingIndicator = null,
  LoadingIndicator = DefaultLoadingIndicator,
  EmptyStateIndicator = DefaultEmptyStateIndicator,
}) => {
  const { t } = useContext(TranslationContext);
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);

  const virtuoso = useRef(
    /** @type {import('react-virtuoso').VirtuosoMethods | undefined} */ (undefined),
  );
  const mounted = useRef(false);
  const atBottom = useRef(false);
  const lastMessageId = useRef('');

  useEffect(() => {
    /* handle scrolling behavior for new messages */
    if (!messages?.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id || ''; // update last message id

    /* do nothing if new messages are loaded from top(loadMore)  */
    if (lastMessage.id === prevMessageId) return;

    /* if list is already at the bottom return, followOutput will do the job */
    if (atBottom.current) return;

    /* if the new message belongs to current user scroll to bottom */
    if (lastMessage.user?.id === client.userID) {
      setTimeout(() => virtuoso.current?.scrollToIndex(messages.length));
      return;
    }

    /* otherwise just show newMessage notification  */
    setNewMessagesNotification(true);
  }, [client.userID, messages]);

  useEffect(() => {
    /*
     * scroll to bottom when list is rendered for the first time
     * this is due to initialTopMostItemIndex buggy behavior leading to empty screen
     */
    if (mounted.current) return;
    mounted.current = true;
    if (messages?.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length - 1);
    }
  }, [messages?.length]);

  const messageRenderer = useCallback(
    (messageList, i) => {
      // use custom renderer supplied by client if present and skip the rest
      if (customMessageRenderer) return customMessageRenderer(messageList, i);

      const message = messageList[i];
      if (!message) return <div style={{ height: '1px' }}></div>; // returning null or zero height breaks the virtuoso

      if (message.type === 'channel.event' || message.type === 'system')
        return <MessageSystem message={message} />;

      if (message.deleted_at)
        return smartRender(MessageDeleted, { message }, null);

      return (
        <Message
          groupedByUser={
            shouldGroupByUser &&
            i > 0 &&
            message.user.id === messageList[i - 1].user.id
          }
          message={message}
        />
      );
    },
    [MessageDeleted, customMessageRenderer, shouldGroupByUser],
  );

  if (!messages) {
    return null;
  }

  return (
    <div className='str-chat__virtual-list'>
      <Virtuoso
        atBottomStateChange={(isAtBottom) => {
          atBottom.current = isAtBottom;
          if (isAtBottom && newMessagesNotification)
            setNewMessagesNotification(false);
        }}
        emptyComponent={() => <EmptyStateIndicator listType='message' />}
        followOutput={true}
        footer={() =>
          TypingIndicator ? <TypingIndicator avatarSize={24} /> : <></>
        }
        header={() =>
          loadingMore ? (
            <div className='str-chat__virtual-list__loading'>
              <LoadingIndicator size={20} />
            </div>
          ) : (
            <></>
          )
        } // reset the cache once it reaches 2k
        item={(i) => messageRenderer(messages, i)}
        maxHeightCacheSize={2000}
        overscan={overscan}
        // @ts-expect-error
        ref={virtuoso}
        scrollSeek={scrollSeekPlaceHolder}
        startReached={() => {
          // mounted.current prevents immediate loadMore on first render
          if (mounted.current && hasMore) {
            loadMore(messageLimit).then(
              virtuoso.current?.adjustForPrependedItems,
            );
          }
        }}
        totalCount={messages.length}
      />

      <div className='str-chat__list-notifications'>
        <MessageNotification
          onClick={() => {
            if (virtuoso.current)
              virtuoso.current.scrollToIndex(messages.length);
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
        /* {Required<Pick<import('types').ChannelContextValue, 'client' | 'messages' | 'loadMore' | 'hasMore' | 'loadingMore'>>} */ context,
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
