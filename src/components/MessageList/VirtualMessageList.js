import React, { useEffect, useMemo, useRef } from 'react';
import deepequal from 'react-fast-compare';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';

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

const Message = React.memo(function Message({ client, message, group }) {
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === client.userID;

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
}, deepequal);

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
  if (
    message.type === 'channel.event' ||
    message.type === 'system' ||
    !message.text
  ) {
    return null;
  }

  return (
    <Message
      client={client}
      message={message}
      prevMessage={prevMessage}
      group={groupStyle(client.userID, prevMessage, nextMessage)}
    />
  );
};

const VirtualMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  height,
  width,
  disableLoadMore,
}) => {
  const virtuoso = useRef();
  const mounted = useRef(false);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isOwner = lastMessage.user.id === client.userID;
    if (isOwner) virtuoso.current.scrollToIndex(messages.length);
  }, [client.userID, messages]);

  useEffect(() => {
    if (mounted.current) return;
    if (messages.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length);
      mounted.current = true;
    }
  }, [messages.length]);

  if (!messages.length) return <EmptyStateIndicator listType="message" />;

  return (
    <div className="str-chat__virtual-list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: width || '100%', height: height || '100%' }}
        totalCount={messages.length}
        item={(i) =>
          messageRenderer(client, messages[i], messages[i - 1], messages[i + 1])
        }
        overscan={20}
        rangeChanged={({ startIndex }) => {
          if (
            !disableLoadMore &&
            mounted.current &&
            hasMore &&
            startIndex < 10
          ) {
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

const MemoizeVirtualMessageList = React.memo(VirtualMessageList, deepequal);

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
            isLoading={loadingMore}
            {...props}
          />
        );
      }}
    </ChannelContext.Consumer>
  );
}
