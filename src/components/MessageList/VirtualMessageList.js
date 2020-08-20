import React, { useEffect, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';
import { LoadingIndicator } from '../Loading';
import { EventComponent } from '../EventComponent';

import MessageTimestamp from '../Message/MessageTimestamp';

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

const Message = React.memo(function Message({ userID, message, group }) {
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === userID;

  const bubbleClass = isOwner
    ? 'str-chat__virtual-message__bubble str-chat__virtual-message__bubble--me'
    : 'str-chat__virtual-message__bubble';
  const wrapperClass = isOwner
    ? 'str-chat__virtual-message__wrapper str-chat__virtual-message__wrapper--me'
    : 'str-chat__virtual-message__wrapper';

  const groupClass = `str-chat__virtual-message--${group}`;

  return (
    <div key={message.id} className={`${wrapperClass} ${groupClass}`}>
      <Avatar
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      <div className="str-chat__virtual-message__content">
        <div className={bubbleClass}>{renderedText}</div>
        <div className="str-chat__virtual-message__meta">
          <span className="str-chat__virtual-message__author">
            <strong>{message.user.name ? message.user.name : 'unknown'}</strong>
          </span>
          <span className="str-chat__virtual-message__date">
            <MessageTimestamp
              customClass="str-chat__message-simple-timestamp"
              message={message}
              calendar
            />
          </span>
        </div>
      </div>
    </div>
  );
});

const groupStyle = (userID, prevMessage, nextMessage) => {
  const top = prevMessage?.user.id !== userID;
  const bottom = nextMessage?.user.id !== userID;
  if (top && bottom) return 'single';

  if (prevMessage?.user.id === userID && nextMessage?.user.id === userID)
    return 'middle';
  if (top) return 'top';
  if (bottom) return 'bottom';
  return '';
};

const messageRenderer = (client, message, prevMessage, nextMessage) => {
  if (!message) return null;

  if (message.type === 'channel.event' || message.type === 'system')
    return <EventComponent message={message} />;

  if (!message.text) return null; // TODO: remove when attachments are supported

  return (
    <Message
      userID={client.userID}
      message={message}
      prevMessage={prevMessage}
      group={groupStyle(message.user.id, prevMessage, nextMessage)}
    />
  );
};

const VirtualMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  disableLoadMore,
  loadingMore,
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

  if (!messages.length) return <EmptyStateIndicator listType="message" />;

  return (
    <div className="str-chat__virtual-list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: '100%', height: '100%' }}
        totalCount={messages.length}
        followOutput={true} // when list is at the bottom, it stick for new messages
        overscan={100} // extra render in px
        item={(i) =>
          messageRenderer(client, messages[i], messages[i - 1], messages[i + 1])
        }
        header={() => (
          <div
            style={{ visibility: loadingMore ? null : 'hidden' }}
            className="str-chat__virtual-list__loading"
          >
            <LoadingIndicator size={20} />
          </div>
        )}
        startReached={() => {
          if (!disableLoadMore && mounted.current && hasMore) {
            loadMore().then(virtuoso.current.adjustForPrependedItems);
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

const MemoizeVirtualMessageList = React.memo(VirtualMessageList);

export default function VirtualMessageListWithContext(props) {
  return (
    <ChannelContext.Consumer>
      {({ messages, client, loadMore, hasMore, loadingMore }) => {
        return (
          <MemoizeVirtualMessageList
            messages={messages}
            client={client}
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
