import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import deepequal from 'react-fast-compare';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';

const Message = React.memo(function Message({ client, message }) {
  const renderedText = useMemo(
    () => renderText(message.text, message.mentioned_users),
    [message.text, message.mentioned_users],
  );

  const isOwner = message.user.id === client.userID;
  return (
    <div
      key={message.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: '10px',
        flexDirection: isOwner ? 'row-reverse' : 'row',
      }}
    >
      <Avatar
        image={message.user.image}
        name={message.user.name || message.user.id}
      />
      {renderedText}
    </div>
  );
}, deepequal);

const FastMessageList = ({ client, messages, loadMore, hasMore }) => {
  const virtuoso = useRef();
  const mounted = useRef(false);

  useEffect(() => {
    if (!messages.length) return;

    const lastMessage = messages[messages.length - 1];
    const isOwner = lastMessage.user.id === client.userID;
    if (isOwner) virtuoso.current.scrollToIndex(messages.length);
  }, [client.userID, messages]);

  const itemRenderer = useCallback(
    (message) => {
      if (!message) return null;
      if (message.type === 'channel.event' || message.type === 'system') {
        return null;
      }

      return <Message client={client} message={message} />;
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
    <div className="str-chat__list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: '100%', height: '100%' }}
        totalCount={messages.length + 3} // +3 is just a hack to show last messages in the dom
        rangeChanged={({ startIndex }) => {
          if (hasMore && startIndex < 10)
            loadMore().then(virtuoso.current.adjustForPrependedItems);
        }}
        item={(index) => itemRenderer(messages[index])}
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
