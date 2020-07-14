/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-continue */
/* eslint-disable sonarjs/no-duplicate-string */
import React, { useMemo } from 'react';
import deepequal from 'react-fast-compare';

import { Message } from '../Message';
import { InfiniteScroll } from '../InfiniteScrollPaginator';

// fast since it usually iterates just the last few messages
const getLastReceived = (messages) => {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].status === 'received') return messages[i].id;
  }
  return null;
};

const getReadStates = (messages, read) => {
  // create object with empty array for each message id
  const readData = {};
  Object.values(read).forEach((readState) => {
    if (!readState.last_read) return;

    let userLastReadMsgId;
    messages.forEach((msg) => {
      if (msg.updated_at < readState.last_read) userLastReadMsgId = msg.id;
    });

    if (userLastReadMsgId) {
      if (!readData[userLastReadMsgId]) readData[userLastReadMsgId] = [];
      readData[userLastReadMsgId].push(readState.user);
    }
  });

  return readData;
};

const insertDates = (messages) => {
  const newMessages = [];
  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];
    if (message.type === 'message.read') {
      newMessages.push(message);
      continue;
    }
    const messageDate = message.created_at.toDateString();
    let prevMessageDate = messageDate;
    if (i > 0) {
      prevMessageDate = messages[i - 1].created_at.toDateString();
    }

    if (i === 0 || messageDate !== prevMessageDate) {
      newMessages.push(
        { type: 'message.date', date: message.created_at },
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};

const insertIntro = (messages, headerPosition) => {
  const newMessages = messages;
  // if no headerPosition is set, HeaderComponent will go at the top
  if (!headerPosition) {
    newMessages.unshift({ type: 'channel.intro' });
    return newMessages;
  }

  // if no messages, intro get's inserted
  if (!newMessages.length) {
    newMessages.unshift({ type: 'channel.intro' });
    return newMessages;
  }

  // else loop over the messages
  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];

    const messageTime = message.created_at
      ? message.created_at.getTime()
      : null;
    const nextMessageTime =
      messages[i + 1] && messages[i + 1].created_at
        ? messages[i + 1].created_at.getTime()
        : null;

    // headerposition is smaller than message time so comes after;
    if (messageTime < headerPosition) {
      // if header position is also smaller than message time continue;
      if (nextMessageTime < headerPosition) {
        if (messages[i + 1] && messages[i + 1].type === 'message.date')
          continue;
        if (!nextMessageTime) {
          newMessages.push({ type: 'channel.intro' });
          return newMessages;
        }
        continue;
      } else {
        newMessages.splice(i + 1, 0, { type: 'channel.intro' });
        return newMessages;
      }
    }
  }

  return newMessages;
};

const getGroupStyles = (
  message,
  previousMessage,
  nextMessage,
  noGroupByUser,
) => {
  if (message.type === 'message.date') return '';
  if (message.type === 'channel.event') return '';
  if (message.type === 'channel.intro') return '';

  if (noGroupByUser || message.attachments.length !== 0) return 'single';

  const isTopMessage =
    !previousMessage ||
    previousMessage.type === 'channel.intro' ||
    previousMessage.type === 'message.date' ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'channel.event' ||
    previousMessage.attachments.length !== 0 ||
    message.user.id !== previousMessage.user.id ||
    previousMessage.type === 'error' ||
    previousMessage.deleted_at;

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'message.date' ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'channel.event' ||
    nextMessage.type === 'channel.intro' ||
    nextMessage.attachments.length !== 0 ||
    message.user.id !== nextMessage.user.id ||
    nextMessage.type === 'error' ||
    nextMessage.deleted_at;

  if (!isTopMessage && !isBottomMessage) {
    if (message.deleted_at || message.type === 'error') return 'single';
    return 'middle';
  }

  if (isBottomMessage) {
    if (isTopMessage || message.deleted_at || message.type === 'error')
      return 'single';
    return 'bottom';
  }

  if (isTopMessage) return 'top';

  return '';
};

const MessageListInner = (props) => {
  const {
    EmptyStateIndicator,
    MessageSystem,
    DateSeparator,
    HeaderComponent,
    headerPosition,
    bottomRef,
    onMessageLoadCaptured,
    messages,
    noGroupByUser,
    client,
    threadList,
    read,
    internalMessageProps,
    internalInfiniteScrollProps,
  } = props;

  const enrichedMessages = useMemo(() => {
    const messageWithDates = insertDates(messages);
    // messageWithDates.sort((a, b) => a.created_at - b.created_at); // TODO: remove if no issue came up
    if (HeaderComponent) return insertIntro(messageWithDates, headerPosition);
    return messageWithDates;
  }, [HeaderComponent, headerPosition, messages]);

  const messageGroupStyles = useMemo(
    () =>
      enrichedMessages.reduce((acc, message, i) => {
        const style = getGroupStyles(
          message,
          enrichedMessages[i - 1],
          enrichedMessages[i + 1],
          noGroupByUser,
        );
        if (style) acc[message.id] = style;
        return acc;
      }, {}),
    [enrichedMessages, noGroupByUser],
  );

  // get the readData, but only for messages submitted by the user themselves
  const readData = useMemo(
    () =>
      getReadStates(
        enrichedMessages.filter(({ user }) => user?.id === client.userID),
        read,
      ),
    [client.userID, enrichedMessages, read],
  );

  const lastReceivedId = useMemo(() => getLastReceived(enrichedMessages), [
    enrichedMessages,
  ]);

  const elements = useMemo(() => {
    return enrichedMessages.map((message) => {
      if (message.type === 'message.date') {
        if (threadList) return null;

        return (
          <li key={`${message.date.toISOString()}-i`}>
            <DateSeparator date={message.date} />
          </li>
        );
      }

      if (message.type === 'channel.intro') {
        return (
          <li key="intro">
            <HeaderComponent />
          </li>
        );
      }

      if (message.type === 'channel.event' || message.type === 'system') {
        if (!MessageSystem) return null;
        return (
          <li key={message.event?.created_at || message.created_at || ''}>
            <MessageSystem message={message} />
          </li>
        );
      }

      if (message.type !== 'message.read') {
        const groupStyles = messageGroupStyles[message.id] || '';

        return (
          <li
            className={`str-chat__li str-chat__li--${groupStyles}`}
            key={message.id || message.created_at}
            onLoadCapture={onMessageLoadCaptured}
          >
            <Message
              client={client}
              message={message}
              groupStyles={[groupStyles]} /* TODO: convert to simple string */
              readBy={readData[message.id] || []}
              lastReceivedId={lastReceivedId}
              threadList={threadList}
              {...internalMessageProps}
            />
          </li>
        );
      }

      return null;
    });
  }, [
    MessageSystem,
    client,
    enrichedMessages,
    internalMessageProps,
    lastReceivedId,
    messageGroupStyles,
    onMessageLoadCaptured,
    readData,
    threadList,
  ]);

  if (!elements.length) return <EmptyStateIndicator listType="message" />;

  return (
    <InfiniteScroll
      isReverse
      useWindow={false}
      className="str-chat__reverse-infinite-scroll"
      data-testid="reverse-infinite-scroll"
      {...internalInfiniteScrollProps}
    >
      <ul className="str-chat__ul">{elements}</ul>

      <div key="bottom" ref={bottomRef} />
    </InfiniteScroll>
  );
};

export default React.memo(MessageListInner, deepequal);
