import React, { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { FixedHeightMessage } from '../Message';
import { EventComponent } from '../EventComponent';
import { LoadingIndicator as DefaultLoadingIndicator } from '../Loading';
import { EmptyStateIndicator as DefaultEmptyStateIndicator } from '../EmptyStateIndicator';

// eslint-disable-next-line no-unused-vars
const ScrollSeekPlaceholder = ({ height, index }) => (
  <div
    style={{
      height,
      backgroundColor: '#fff',
      padding: '8px',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ background: '#ccc', height: '100%' }}>{index}</div>
  </div>
);

const VirtualMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  messageLimit,
  loadingMore,
  LoadingIndicator,
  EmptyStateIndicator,
  MessageSystem,
  Message,
}) => {
  const virtuoso = useRef();
  const mounted = useRef(false);
  const lastMessageId = useRef('');

  useEffect(() => {
    /* scroll to bottom when current user add new message */
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    // making sure it is the last message that has changed before forcing scroll
    // buggy scenario is last message belongs to current user and loadMore prepend more messages
    if (lastMessage.id !== lastMessageId.current) {
      lastMessageId.current = lastMessage.id;
      if (lastMessage.user.id === client.userID)
        virtuoso.current.scrollToIndex(messages.length);
    }
  }, [client.userID, messages]);

  useEffect(() => {
    /* scroll to bottom when list is rendered for the first time 
    this approach is used since virtuoso initialTopMostItemIndex is buggy leading to empty screen
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

  if (!messages.length) return <EmptyStateIndicator listType="message" />;

  return (
    <div className="str-chat__virtual-list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: '100%', height: '100%' }}
        totalCount={messages.length}
        followOutput={true} // when list is at the bottom, it stick for new messages
        overscan={100} // extra render in px
        item={(i) => messageRenderer(messages[i])}
        header={() => (
          <div
            style={{ visibility: loadingMore ? null : 'hidden' }}
            className="str-chat__virtual-list__loading"
          >
            <LoadingIndicator size={20} />
          </div>
        )}
        startReached={() => {
          if (mounted.current && hasMore) {
            loadMore(messageLimit).then(
              virtuoso.current.adjustForPrependedItems,
            );
          }
        }}
        // scrollSeek={{
        //   enter: (velocity) => Math.abs(velocity) > 220,
        //   exit: (velocity) => Math.abs(velocity) < 30,
        //   change: () => null,
        //   placeholder: ScrollSeekPlaceholder,
        // }}
      />
    </div>
  );
};

VirtualMessageList.propTypes = {
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
};

VirtualMessageList.defaultProps = {
  messageLimit: 100,
  Message: FixedHeightMessage,
  MessageSystem: EventComponent,
  LoadingIndicator: DefaultLoadingIndicator,
  EmptyStateIndicator: DefaultEmptyStateIndicator,
};

export default function VirtualMessageListWithContext(props) {
  return (
    <ChannelContext.Consumer>
      {({ client, messages, loadMore, hasMore, loadingMore }) => {
        return (
          <VirtualMessageList
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
