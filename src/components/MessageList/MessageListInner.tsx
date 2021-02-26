/* eslint-disable no-continue */
import React, { RefObject, useMemo } from 'react';
import isEqual from 'lodash.isequal';

import { Message } from '../Message';
import { InfiniteScroll } from '../InfiniteScrollPaginator';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';
import type {
  Channel,
  MessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';
import type {
  DateSeparatorProps,
  EmptyStateIndicatorProps,
  InfiniteScrollProps,
  MessageProps,
  TypingIndicatorProps,
} from 'types';

export interface MessageListInnerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> {
  bottomRef: RefObject<HTMLDivElement>;
  /** The current channel this message is displayed in */
  channel: Channel<Ch>;
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>;
  DateSeparator: React.ComponentType<DateSeparatorProps>;
  messages: MessageResponse<At, Ch, Co, Me, Re, Us>[];
  noGroupByUser: boolean;
  onMessageLoadCaptured: (
    event: React.SyntheticEvent<HTMLLIElement, Event>,
  ) => void;
  threadList: boolean;
  TypingIndicator: React.ComponentType<TypingIndicatorProps>;
  disableDateSeparator?: boolean;
  EmptyStateIndicator?: React.ComponentType<EmptyStateIndicatorProps>;
  HeaderComponent?: React.ComponentType;
  headerPosition?: number;
  hideDeletedMessages?: boolean;
  internalInfiniteScrollProps?: InfiniteScrollProps;
  internalMessageProps?: MessageProps<At, Ch, Co, Ev, Me, Re, Us>;
  MessageSystem?: React.ComponentType<{
    message: MessageResponse<At, Ch, Co, Me, Re, Us>;
  }>;
  read?: Record<string, { last_read: Date; user: UserResponse<Us> }>;
}

// fast since it usually iterates just the last few messages
const getLastReceived = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages: MessageResponse<At, Ch, Co, Me, Re, Us>[],
) => {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].status === 'received') return messages[i].id;
  }
  return null;
};

const getReadStates = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages: MessageResponse<At, Ch, Co, Me, Re, Us>[],
  read: Record<string, { last_read: Date; user: UserResponse<Us> }> = {},
) => {
  // create object with empty array for each message id
  const readData: Record<string, Array<UserResponse<Us>>> = {};

  Object.values(read).forEach((readState) => {
    if (!readState.last_read) return;

    let userLastReadMsgId;
    messages.forEach((msg) => {
      //@ts-expect-error
      if (msg.updated_at < readState.last_read) userLastReadMsgId = msg.id;
    });

    if (userLastReadMsgId) {
      if (!readData[userLastReadMsgId]) readData[userLastReadMsgId] = [];
      readData[userLastReadMsgId].push(readState.user);
    }
  });

  return readData;
};

const insertDates = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages: MessageResponse<At, Ch, Co, Me, Re, Us>[],
  lastRead?: Date | string | null,
  userID?: string,
  hideDeletedMessages?: boolean,
): MessageResponse<At, Ch, Co, Me, Re, Us>[] => {
  let unread = false;
  let lastDateSeparator;
  const newMessages: MessageResponse<At, Ch, Co, Me, Re, Us>[] = [];

  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (message.type === 'message.read') {
      newMessages.push(message);
      continue;
    }

    //@ts-expect-error
    const messageDate = message.created_at.toDateString();
    let prevMessageDate = messageDate;

    if (i > 0) {
      //@ts-expect-error
      prevMessageDate = messages[i - 1].created_at.toDateString();
    }

    if (!unread) {
      //@ts-expect-error
      unread = lastRead && new Date(lastRead) < message.created_at;

      // do not show date separator for current user's messages
      //@ts-expect-error
      if (unread && message.user.id !== userID) {
        //@ts-expect-error
        newMessages.push({
          date: message.created_at,
          type: 'message.date',
          unread,
        });
      }
    }

    if (
      (i === 0 ||
        messageDate !== prevMessageDate ||
        (hideDeletedMessages &&
          messages[i - 1]?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      newMessages?.[newMessages.length - 1]?.type !== 'message.date' // do not show two date separators in a row
    ) {
      lastDateSeparator = messageDate;

      newMessages.push(
        //@ts-expect-error
        { date: message.created_at, type: 'message.date' },
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};

const insertIntro = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  messages: MessageResponse<At, Ch, Co, Me, Re, Us>[],
  headerPosition?: number,
) => {
  const newMessages = messages;
  const intro = ({ type: 'channel.intro' } as unknown) as MessageResponse<
    At,
    Ch,
    Co,
    Me,
    Re,
    Us
  >;
  // if no headerPosition is set, HeaderComponent will go at the top
  if (!headerPosition) {
    newMessages.unshift(intro);
    return newMessages;
  }

  // if no messages, intro gets inserted
  if (!newMessages.length) {
    newMessages.unshift(intro);
    return newMessages;
  }

  // else loop over the messages
  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];

    const messageTime = message.created_at
      ? //@ts-expect-error
        message.created_at.getTime()
      : null;
    const nextMessageTime =
      messages[i + 1] && messages[i + 1].created_at
        ? //@ts-expect-error
          messages[i + 1].created_at.getTime()
        : null;

    // header position is smaller than message time so comes after;
    if (messageTime < headerPosition) {
      // if header position is also smaller than message time continue;
      if (nextMessageTime < headerPosition) {
        if (messages[i + 1] && messages[i + 1].type === 'message.date')
          continue;
        if (!nextMessageTime) {
          newMessages.push(intro);
          return newMessages;
        }
        continue;
      } else {
        newMessages.splice(i + 1, 0, intro);
        return newMessages;
      }
    }
  }

  return newMessages;
};

type Style = '' | 'middle' | 'top' | 'bottom' | 'single';

const getGroupStyles = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  message: MessageResponse<At, Ch, Co, Me, Re, Us>,
  previousMessage: MessageResponse<At, Ch, Co, Me, Re, Us>,
  nextMessage: MessageResponse<At, Ch, Co, Me, Re, Us>,
  noGroupByUser: boolean,
): Style => {
  if (message.type === 'message.date') return '';
  if (message.type === 'channel.event') return '';
  if (message.type === 'channel.intro') return '';

  //@ts-expect-error
  if (noGroupByUser || message.attachments.length !== 0) return 'single';

  const isTopMessage =
    !previousMessage ||
    previousMessage.type === 'channel.intro' ||
    previousMessage.type === 'message.date' ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'channel.event' ||
    //@ts-expect-error
    previousMessage.attachments.length !== 0 ||
    //@ts-expect-error
    message.user.id !== previousMessage.user.id ||
    previousMessage.type === 'error' ||
    previousMessage.deleted_at;

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'message.date' ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'channel.event' ||
    nextMessage.type === 'channel.intro' ||
    //@ts-expect-error
    nextMessage.attachments.length !== 0 ||
    //@ts-expect-error
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

const UnMemoizedMessageListInner = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListInnerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    bottomRef,
    channel,
    client,
    DateSeparator,
    disableDateSeparator = false,
    EmptyStateIndicator,
    HeaderComponent,
    headerPosition,
    hideDeletedMessages = false,
    internalInfiniteScrollProps,
    internalMessageProps,
    messages,
    MessageSystem,
    noGroupByUser,
    onMessageLoadCaptured,
    read,
    threadList,
    TypingIndicator,
  } = props;

  const lastRead = useMemo(() => channel.lastRead(), [channel]);

  const enrichMessages = () => {
    const messageWithDates =
      disableDateSeparator || threadList
        ? messages
        : insertDates(messages, lastRead, client.userID, hideDeletedMessages);
    if (HeaderComponent)
      return insertIntro<At, Ch, Co, Me, Re, Us>(
        messageWithDates,
        headerPosition,
      );

    return messageWithDates;
  };

  const enrichedMessages = enrichMessages();

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
      }, {} as Record<string, Style>),
    [enrichedMessages, noGroupByUser],
  );

  // get the readData, but only for messages submitted by the user themselves
  const readData = useMemo(
    () =>
      getReadStates<At, Ch, Co, Me, Re, Us>(
        enrichedMessages.filter(({ user }) => user?.id === client.userID),
        read,
      ),
    [client.userID, enrichedMessages, read],
  );

  const lastReceivedId = useMemo(() => getLastReceived(enrichedMessages), [
    enrichedMessages,
  ]);

  const elements = useMemo(
    () =>
      enrichedMessages.map((message) => {
        if (message.type === 'message.date') {
          return (
            <li key={`${(message.date as Date).toISOString()}-i`}>
              <DateSeparator
                date={message.date as Date}
                unread={!!message.unread}
              />
            </li>
          );
        }

        if (message.type === 'channel.intro' && HeaderComponent) {
          return (
            <li key='intro'>
              <HeaderComponent />
            </li>
          );
        }

        if (message.type === 'channel.event' || message.type === 'system') {
          if (!MessageSystem) return null;
          return (
            <li
              key={
                (message.event as { created_at: string })?.created_at ||
                message.created_at ||
                ''
              }
            >
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
              <Message<At, Ch, Co, Ev, Me, Re, Us>
                client={client}
                groupStyles={[groupStyles]} /* TODO: convert to simple string */
                lastReceivedId={lastReceivedId}
                message={message}
                readBy={readData[message.id] || []}
                threadList={threadList}
                {...internalMessageProps}
              />
            </li>
          );
        }

        return null;
      }),
    [
      client,
      enrichedMessages,
      internalMessageProps,
      lastReceivedId,
      messageGroupStyles,
      MessageSystem,
      onMessageLoadCaptured,
      readData,
      threadList,
    ],
  );

  if (!elements.length && EmptyStateIndicator) {
    return <EmptyStateIndicator listType='message' />;
  }

  return (
    <InfiniteScroll
      className='str-chat__reverse-infinite-scroll'
      data-testid='reverse-infinite-scroll'
      isReverse
      useWindow={false}
      {...internalInfiniteScrollProps}
    >
      <ul className='str-chat__ul'>{elements}</ul>
      <TypingIndicator threadList={threadList} />
      <div key='bottom' ref={bottomRef} />
    </InfiniteScroll>
  );
};

export const MessageListInner = React.memo(
  UnMemoizedMessageListInner,
  isEqual,
) as typeof UnMemoizedMessageListInner;
