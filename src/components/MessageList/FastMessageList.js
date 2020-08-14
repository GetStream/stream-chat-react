import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import deepequal from 'react-fast-compare';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';

import MessageTimestamp from '../Message/MessageTimestamp';

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

const Message = React.memo(function Message({ client, message, prevMessage }) {
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === client.userID;
  const prevMessageIsMine = prevMessage?.user.id === client.userID;

  const bubbleClass = isOwner
    ? 'str-chat__fast-message__bubble str-chat__fast-message__bubble--me'
    : 'str-chat__fast-message__bubble';
  const wrapperClass = isOwner
    ? 'str-chat__fast-message__wrapper str-chat__fast-message__wrapper--me'
    : 'str-chat__fast-message__wrapper';
  const metaClass = isOwner
    ? 'str-chat__fast-message__meta'
    : 'str-chat__fast-message__meta';
  return (
    <div key={message.id} className={wrapperClass}>
      <Avatar
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      <div className="str-chat__fast-message__content">
        <div className={bubbleClass}>{renderedText}</div>
        <div className={metaClass}>
          <span className="str-chat__fast-message__author">
            <strong>{message.user.name ? message.user.name : 'unknown'}</strong>
          </span>
          <span className="str-chat__fast-message__date">
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
}, deepequal);

const FastMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  hackNumber,
}) => {
  const virtuoso = useRef();
  const mounted = useRef(false);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isOwner = lastMessage.user.id === client.userID;
    if (isOwner) virtuoso.current.scrollToIndex(messages.length);
  }, [client.userID, messages]);

  const itemRenderer = useCallback(
    (message, prevMessage) => {
      if (!message) return null;
      if (message.type === 'channel.event' || message.type === 'system') {
        return null;
      }

      return (
        <Message client={client} message={message} prevMessage={prevMessage} />
      );
    },
    [client],
  );

  useEffect(() => {
    if (mounted.current) return;
    if (messages.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length);
      mounted.current = true;
    }
  }, [messages.length]);

  if (!messages.length) return <EmptyStateIndicator listType="message" />;

  return (
    <div className="str-chat__fast-list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: '100%', height: '100%' }}
        totalCount={messages.length + (hackNumber || 0)}
        item={(index) => itemRenderer(messages[index], messages[index - 1])}
        rangeChanged={({ startIndex }) => {
          if (mounted.current && hasMore && startIndex < 10)
            loadMore().then(virtuoso.current.adjustForPrependedItems);
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

const MemoizeFastMessageList = React.memo(FastMessageList, deepequal);

export default function FastMessageListWithContext(props) {
  return (
    <ChannelContext.Consumer>
      {({ messages, client, loadMore, hasMore, loadingMore }) => {
        return (
          <MemoizeFastMessageList
            messages={messages}
            client={client}
            loadMore={loadMore}
            hasMore={hasMore}
            isLoading={loadingMore}
            {...props}
          />
        );
      }}
    </ChannelContext.Consumer>
  );
}
