import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';

import MessageNotification from './MessageNotification';
import { ChannelContext, TranslationContext } from '../../context';
import { FixedHeightMessage } from '../Message';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';

/**
 * VirtualizedMessageList - This component renders a list of messages in a virtual list. Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react/#channel)
 * It is pretty fast for rendering thousands of messages but it needs its Message componet to have fixed height
 * @example ../../docs/VirtualizedMessageList.md
 */
const VirtualizedMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  messageLimit,
  loadingMore,
  overscan,
  scrollSeekPlaceHolder,
  LoadingIndicator,
  EmptyStateIndicator,
  MessageSystem,
  Message,
}) => {
  const { t } = useContext(TranslationContext);
  const [newMessagesNotification, setNewMessagesNotification] = useState(false);

  const virtuoso = useRef();
  const mounted = useRef(false);
  const atBottom = useRef(false);
  const lastMessageId = useRef('');

  useEffect(() => {
    /* handle scrolling behavior for new messages */
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const prevMessageId = lastMessageId.current;
    lastMessageId.current = lastMessage.id; // update last message id

    /* do nothing if new messages are loaded from top(loadMore)  */
    if (lastMessage.id === prevMessageId) return;

    /* if list is already at the bottom make it sticky */
    if (atBottom.current) {
      setTimeout(() => virtuoso.current.scrollToIndex(messages.length)); // setTimeout is needed to delay the scroll until react flushes
      return;
    }

    /* if the new message belongs to current user scroll to bottom */
    if (lastMessage.user.id === client.userID) {
      setTimeout(() => virtuoso.current.scrollToIndex(messages.length));
      return;
    }

    /* otherwise just show newMessage notification  */
    setNewMessagesNotification(true);

    lastMessageId.current = lastMessage.id;
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
      if (!message) return null;

      if (message.type === 'channel.event' || message.type === 'system')
        return <MessageSystem message={message} />;

      if (!message.text) return null; // TODO: remove when attachments are supported

      return <Message userID={client.userID} message={message} />;
    },
    [client.userID],
  );

  return (
    <div className="str-chat__virtual-list">
      <Virtuoso
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
              virtuoso.current.adjustForPrependedItems,
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

VirtualizedMessageList.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  client: PropTypes.object.isRequired,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  messages: PropTypes.array.isRequired,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  loadMore: PropTypes.func,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  hasMore: PropTypes.bool,
  /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#channel)** */
  loadingMore: PropTypes.bool,
  /** Set the limit to use when paginating messages */
  messageLimit: PropTypes.number,
  /**
   * Custom UI component to display system messages.
   *
   * Defaults to and accepts same props as: [EventComponent](https://github.com/GetStream/stream-chat-react/blob/master/src/components/EventComponent.js)
   */
  MessageSystem: PropTypes.elementType,
  /**
   * The UI Indicator to use when MessagerList or ChannelList is empty
   * */
  EmptyStateIndicator: PropTypes.elementType,
  /**
   * Component to render at the top of the MessageList while loading new messages
   * */
  LoadingIndicator: PropTypes.elementType,
  /** Causes the underlying list to render extra content in addition to the necessary one to fill in the visible viewport. */
  overscan: PropTypes.number,
  /** Performance improvement by showing placeholders if user scrolls fast through list
   * it can be used like this:
   *  {
   *    enter: (velocity) => Math.abs(velocity) > 120,
   *    exit: (velocity) => Math.abs(velocity) < 40,
   *    change: () => null,
   *    placeholder: ({index, height})=> <div style={{height: height + "px"}}>{index}</div>,
   *  }
   */
  scrollSeekPlaceHolder: PropTypes.shape({
    // when to enter into scrollSeek state, usually a velocity above 80 is considered fast scrolling
    // (velocity: number, index: number) => boolean
    enter: PropTypes.func.isRequired,
    // when to exit into scrollSeek state
    // (velocity: number, index: number) => boolean
    exit: PropTypes.func.isRequired,
    // (velocity: number, index: number) => void
    change: PropTypes.func.isRequired,
    // UI to render, this props are passed to it: {height: number, index: number}
    placeholder: PropTypes.elementType.isRequired,
  }),
};

VirtualizedMessageList.defaultProps = {
  messageLimit: 100,
  overscan: 200,
  Message: FixedHeightMessage,
  MessageSystem: EventComponent,
  LoadingIndicator: DefaultLoadingIndicator,
  EmptyStateIndicator: DefaultEmptyStateIndicator,
};

export default function VirtualizedMessageListWithContext(props) {
  return (
    <ChannelContext.Consumer>
      {({ client, messages, loadMore, hasMore, loadingMore }) => {
        return (
          <VirtualizedMessageList
            client={client}
            messages={messages}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            {...props}
          />
        );
      }}
    </ChannelContext.Consumer>
  );
}
