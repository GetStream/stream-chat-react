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

const Message = React.memo(function Message({
  client,
  message,
  prevMessage,
  group,
}) {
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
  const metaClass = isOwner
    ? 'str-chat__virtual-message__meta'
    : 'str-chat__virtual-message__meta';
  const groupClass = `str-chat__virtual-message--${group}`;

  return (
    <div key={message.id} className={`${wrapperClass} ${groupClass}`}>
      <Avatar
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      <div className="str-chat__virtual-message__content">
        <div className={bubbleClass}>{renderedText}</div>
        <div className={metaClass}>
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
},
deepequal);

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

  const itemRenderer = useCallback(
    (message, prevMessage, nextMessage) => {
      if (!message) return null;
      if (
        message.type === 'channel.event' ||
        message.type === 'system' ||
        !message.text
      ) {
        return null;
      }

      const groupStyle = () => {
        const top = prevMessage?.user.id !== client.userID;
        const bottom = nextMessage?.user.id !== client.userID;
        const middle =
          prevMessage?.user.id === client.userID &&
          nextMessage?.user.id === client.userID;

        if (top && bottom) {
          return 'single';
        }

        if (middle) {
          return 'middle';
        }

        if (top) {
          return 'top';
        }

        if (bottom) {
          return 'bottom';
        }
      };

      return (
        <Message
          client={client}
          message={message}
          prevMessage={prevMessage}
          group={groupStyle()}
        />
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
        style={{ width: width || '100%', height: height || '100%' }}
        totalCount={messages.length}
        item={(index) =>
          itemRenderer(
            messages[index],
            messages[index - 1],
            messages[index + 1],
          )
        }
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
