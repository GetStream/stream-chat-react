/* eslint-disable */
import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import deepequal from 'react-fast-compare';
import { Virtuoso } from 'react-virtuoso';

import { ChannelContext } from '../../context';
import { EmptyStateIndicator } from '../EmptyStateIndicator';
import { Avatar } from '../Avatar';
import { renderText } from '../../utils';

const FastMessageList = ({
  client,
  messages,
  loadMore,
  hasMore,
  loadingMore,
}) => {
  const virtuoso = useRef();
  const mounted = useRef(false);

  const itemRenderer = useCallback((message) => {
    if (message.type === 'channel.event' || message.type === 'system') {
      return null;
    }

    return (
      <div
        key={message.id}
        style={{ display: 'flex', alignItems: 'center', margin: '10px' }}
      >
        <Avatar
          image={message.user.image}
          name={message.user.name || message.user.id}
        />
        {renderText(message.text, message?.mentioned_users)}
      </div>
    );
  }, []);

  useEffect(() => {
    if (mounted.current) return;
    if (messages.length && virtuoso.current) {
      virtuoso.current.scrollToIndex(messages.length - 1);
      mounted.current = true;
    }
  }, [messages.length]);

  if (!messages.length) return <EmptyStateIndicator listType="message" />;

  return (
    <div className="str-chat__list">
      <Virtuoso
        ref={virtuoso}
        style={{ width: '100%', height: '100%' }}
        totalCount={messages.length}
        followOutput
        rangeChanged={({ startIndex }) => {
          if (hasMore && startIndex < 10)
            loadMore().then(virtuoso.current.adjustForPrependedItems);
        }}
        item={(index) => itemRenderer(messages[index])}
      />
    </div>
  );
};

const MemoizedFastMessageList = React.memo(FastMessageList, deepequal);

export default (props) => (
  <ChannelContext.Consumer>
    {({ messages, client, loadMore, hasMore, loadingMore }) => {
      return (
        <MemoizedFastMessageList
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
