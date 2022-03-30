/* eslint-disable no-continue */
import { isDate } from '../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

import type { StreamMessage } from '../../context/ChannelStateContext';

type ProcessMessagesParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  messages: StreamMessage<StreamChatGenerics>[];
  userId: string;
  /** Disable date separator in main message list */
  disableDateSeparator?: boolean;
  /** Enable date separator in main message list. Has to be accompanied by @param threadList. */
  enableThreadDateSeparator?: boolean;
  /** Enable deleted messages to be filtered out of resulting message list */
  hideDeletedMessages?: boolean;
  /** Disable date separator display for unread incoming messages */
  hideNewMessageSeparator?: boolean;
  /** Sets the treshold after everything is considered unread */
  lastRead?: Date | null;
  /** Signals whether to separate giphy preview as well as used to set the giphy preview state */
  setGiphyPreviewMessage?: React.Dispatch<
    React.SetStateAction<StreamMessage<StreamChatGenerics> | undefined>
  >;
  /** Signals that the transformed message list represents a thread */
  threadList?: boolean;
};

/**
 * processMessages - Transform the input message list according to config parameters
 *
 * Inserts date separators btw. message groups created on different dates or for group of incoming messages.
 * By default:
 * - enabled in main message list
 * - disabled in thread
 * Allows for deleted messages removal. By default disabled. Enabled by hideDeletedMessages.
 * Sets Giphy preview message for VirtualizedMessageList
 *
 * The only required params are messages and userId, the rest are config params:
 *
 * @return {StreamMessage<StreamChatGenerics>[]} Transformed list of messages
 */
export const processMessages = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  params: ProcessMessagesParams<StreamChatGenerics>,
) => {
  const {
    disableDateSeparator,
    enableThreadDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    messages,
    setGiphyPreviewMessage,
    threadList,
    userId,
  } = params;

  let unread = false;
  let ephemeralMessagePresent = false;
  let lastDateSeparator;
  const newMessages: StreamMessage<StreamChatGenerics>[] = [];
  const dateSeparatorsEnabled =
    !(disableDateSeparator || threadList) || (threadList && enableThreadDateSeparator);

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (setGiphyPreviewMessage && message.type === 'ephemeral' && message.command === 'giphy') {
      ephemeralMessagePresent = true;
      setGiphyPreviewMessage(message);
      continue;
    }

    const messageDate =
      (message.created_at && isDate(message.created_at) && message.created_at.toDateString()) || '';
    const previousMessage = messages[i - 1];
    let prevMessageDate = messageDate;

    if (
      dateSeparatorsEnabled &&
      previousMessage?.created_at &&
      isDate(previousMessage.created_at)
    ) {
      prevMessageDate = previousMessage.created_at.toDateString();
    }

    if (!unread && !hideNewMessageSeparator) {
      unread = (lastRead && message.created_at && new Date(lastRead) < message.created_at) || false;

      // do not show date separator for current user's messages
      if (dateSeparatorsEnabled && unread && message.user?.id !== userId) {
        newMessages.push({
          customType: 'message.date',
          date: message.created_at,
          id: message.id,
          unread,
        } as StreamMessage<StreamChatGenerics>);
      }
    }

    if (
      dateSeparatorsEnabled &&
      (i === 0 ||
        messageDate !== prevMessageDate ||
        (hideDeletedMessages &&
          previousMessage?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      newMessages?.[newMessages.length - 1]?.customType !== 'message.date' // do not show two date separators in a row)
    ) {
      lastDateSeparator = messageDate;

      newMessages.push(
        {
          customType: 'message.date',
          date: message.created_at,
          id: message.id,
        } as StreamMessage<StreamChatGenerics>,
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  // clean up the giphy preview component state after a Cancel action
  if (setGiphyPreviewMessage && !ephemeralMessagePresent) {
    setGiphyPreviewMessage(undefined);
  }

  return newMessages;
};

// fast since it usually iterates just the last few messages
export const getLastReceived = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  messages: StreamMessage<StreamChatGenerics>[],
) => {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].status === 'received') {
      return messages[i].id;
    }
  }

  return null;
};

export const getReadStates = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  messages: StreamMessage<StreamChatGenerics>[],
  read: Record<string, { last_read: Date; user: UserResponse<StreamChatGenerics> }> = {},
  returnAllReadData: boolean,
) => {
  // create object with empty array for each message id
  const readData: Record<string, Array<UserResponse<StreamChatGenerics>>> = {};

  Object.values(read).forEach((readState) => {
    if (!readState.last_read) return;

    let userLastReadMsgId: string | undefined;

    // loop messages sent by current user and add read data for other users in channel
    messages.forEach((msg) => {
      if (msg.updated_at && msg.updated_at < readState.last_read) {
        userLastReadMsgId = msg.id;

        // if true, save other user's read data for all messages they've read
        if (returnAllReadData) {
          if (!readData[userLastReadMsgId]) {
            readData[userLastReadMsgId] = [];
          }

          readData[userLastReadMsgId].push(readState.user);
        }
      }
    });

    // if true, only save read data for other user's last read message
    if (userLastReadMsgId && !returnAllReadData) {
      if (!readData[userLastReadMsgId]) {
        readData[userLastReadMsgId] = [];
      }

      readData[userLastReadMsgId].push(readState.user);
    }
  });

  return readData;
};

export const insertIntro = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  messages: StreamMessage<StreamChatGenerics>[],
  headerPosition?: number,
) => {
  const newMessages = messages;
  const intro = ({ customType: 'channel.intro' } as unknown) as StreamMessage<StreamChatGenerics>;

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
  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];
    const messageTime =
      message.created_at && isDate(message.created_at) ? message.created_at.getTime() : null;

    const nextMessage = messages[i + 1];
    const nextMessageTime =
      nextMessage.created_at && isDate(nextMessage.created_at)
        ? nextMessage.created_at.getTime()
        : null;

    // header position is smaller than message time so comes after;
    if (messageTime && messageTime < headerPosition) {
      // if header position is also smaller than message time continue;
      if (nextMessageTime && nextMessageTime < headerPosition) {
        if (messages[i + 1] && messages[i + 1].customType === 'message.date') continue;
        if (!nextMessageTime) {
          newMessages.push(intro);
          return newMessages;
        }
      } else {
        newMessages.splice(i + 1, 0, intro);
        return newMessages;
      }
    }
  }

  return newMessages;
};

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

export const getGroupStyles = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message: StreamMessage<StreamChatGenerics>,
  previousMessage: StreamMessage<StreamChatGenerics>,
  nextMessage: StreamMessage<StreamChatGenerics>,
  noGroupByUser: boolean,
): GroupStyle => {
  if (message.customType === 'message.date') return '';
  if (message.customType === 'channel.intro') return '';

  if (noGroupByUser || message.attachments?.length !== 0) return 'single';

  const isTopMessage =
    !previousMessage ||
    previousMessage.customType === 'channel.intro' ||
    previousMessage.customType === 'message.date' ||
    previousMessage.type === 'system' ||
    previousMessage.attachments?.length !== 0 ||
    message.user?.id !== previousMessage.user?.id ||
    previousMessage.type === 'error' ||
    previousMessage.deleted_at;

  const isBottomMessage =
    !nextMessage ||
    nextMessage.customType === 'message.date' ||
    nextMessage.type === 'system' ||
    nextMessage.customType === 'channel.intro' ||
    nextMessage.attachments?.length !== 0 ||
    message.user?.id !== nextMessage.user?.id ||
    nextMessage.type === 'error' ||
    nextMessage.deleted_at;

  if (!isTopMessage && !isBottomMessage) {
    if (message.deleted_at || message.type === 'error') return 'single';
    return 'middle';
  }

  if (isBottomMessage) {
    if (isTopMessage || message.deleted_at || message.type === 'error') return 'single';
    return 'bottom';
  }

  if (isTopMessage) return 'top';

  return '';
};
