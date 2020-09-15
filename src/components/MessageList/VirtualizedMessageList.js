// @ts-check
import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Virtuoso } from 'react-virtuoso';

import { smartRender } from '../../utils';
import MessageNotification from './MessageNotification';
import { ChannelContext, TranslationContext } from '../../context';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';
import {
  FixedHeightMessage,
  MessageDeleted as DefaultMessageDeleted,
} from '../Message';

/**
 * VirtualizedMessageList - This component renders a list of messages in a virtual list. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 * It is pretty fast for rendering thousands of messages but it needs its Message componet to have fixed height
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
  scrollSeekPlaceHolder,
  Message = FixedHeightMessage,
  MessageSystem = EventComponent,
  MessageDeleted = DefaultMessageDeleted,
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
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id || ''; // update last message id

    /* do nothing if new messages are loaded from top(loadMore)  */
    if (lastMessage.id === prevMessageId) return;

    /* if list is already at the bottom make it sticky */
    if (atBottom.current) {
      setTimeout(() => virtuoso.current?.scrollToIndex(messages.length)); // setTimeout is needed to delay the scroll until react flushes
      return;
    }

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
    if (messages.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length - 1);
    }
  }, [messages.length]);

  const messageRenderer = useCallback(
    (message) => {
      if (!message) return <></>;

      if (message.type === 'channel.event' || message.type === 'system')
        return <MessageSystem message={message} />;

      if (message.deleted_at)
        return smartRender(MessageDeleted, { message }, null);

      return <Message message={message} />;
    },
    [MessageDeleted],
  );

  return (
    <div className="str-chat__virtual-list">
      <Virtuoso
        // @ts-ignore
        ref={virtuoso}
        totalCount={messages.length}
        overscan={overscan}
        scrollSeek={scrollSeekPlaceHolder}
        item={(i) => messageRenderer(messages[i])}
        emptyComponent={() => <EmptyStateIndicator listType="message" />}
        header={() => (
          <div
            className="str-chat__virtual-list__loading"
            style={{ visibility: loadingMore ? undefined : 'hidden' }}
          >
            <LoadingIndicator size={20} />
          </div>
        )}
        startReached={() => {
          // mounted.current prevents immediate loadMore on first render
          if (mounted.current && hasMore) {
            loadMore(messageLimit).then(
              virtuoso.current?.adjustForPrependedItems,
            );
          }
        }}
        atBottomStateChange={(isAtBottom) => {
          atBottom.current = isAtBottom;
          if (isAtBottom && newMessagesNotification)
            setNewMessagesNotification(false);
        }}
      />

      <div className="str-chat__list-notifications">
        <MessageNotification
          showNotification={newMessagesNotification}
          onClick={() => {
            if (virtuoso.current)
              virtuoso.current.scrollToIndex(messages.length);
            setNewMessagesNotification(false);
          }}
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
  // @ts-ignore
  return (
    <ChannelContext.Consumer>
      {(
        /* {Required<Pick<import('types').ChannelContextValue, 'client' | 'messages' | 'loadMore' | 'hasMore' | 'loadingMore'>>} */ context,
      ) => (
        <VirtualizedMessageList
          client={context.client}
          // @ts-ignore
          messages={context.messages}
          // @ts-ignore
          loadMore={context.loadMore}
          // @ts-ignore
          hasMore={context.hasMore}
          // @ts-ignore
          loadingMore={context.loadingMore}
          {...props}
        />
      )}
    </ChannelContext.Consumer>
  );
}
