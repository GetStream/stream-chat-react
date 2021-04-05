/* eslint-disable no-continue */
import { isDate } from '../../context/TranslationContext';

import type { UserResponse } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

import type { StreamMessage } from '../../context/ChannelStateContext';

export const insertDates = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
  lastRead?: Date | string | null,
  userID?: string,
  hideDeletedMessages?: boolean,
  disableDateSeparator?: boolean,
  hideNewMessageSeparator?: boolean,
) => {
  let unread = false;
  let lastDateSeparator;
  const newMessages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[] = [];

  for (let i = 0, l = messages.length; i < l; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (message.type === 'message.read') {
      newMessages.push(message);
      continue;
    }

    const messageDate =
      (message.created_at && isDate(message.created_at) && message.created_at.toDateString()) || '';
    let prevMessageDate = messageDate;
    const previousMessage = messages[i - 1];

    if (
      i > 0 &&
      !disableDateSeparator &&
      previousMessage.created_at &&
      isDate(previousMessage.created_at)
    ) {
      prevMessageDate = previousMessage.created_at.toDateString();
    }

    if (!unread && !hideNewMessageSeparator) {
      unread = (lastRead && message.created_at && new Date(lastRead) < message.created_at) || false;

      // do not show date separator for current user's messages
      if (!disableDateSeparator && unread && message.user?.id !== userID) {
        newMessages.push({
          date: message.created_at,
          id: message.id,
          type: 'message.date',
          unread,
        } as StreamMessage<At, Ch, Co, Ev, Me, Re, Us>);
      }
    }

    if (
      !disableDateSeparator &&
      (i === 0 ||
        messageDate !== prevMessageDate ||
        (hideDeletedMessages &&
          messages[i - 1]?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      newMessages?.[newMessages.length - 1]?.type !== 'message.date' // do not show two date separators in a row
    ) {
      lastDateSeparator = messageDate;

      newMessages.push(
        {
          date: message.created_at,
          id: message.id,
          type: 'message.date',
        } as StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};

// fast since it usually iterates just the last few messages
export const getLastReceived = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
) => {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].status === 'received') {
      return messages[i].id;
    }
  }

  return null;
};

export const getReadStates = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
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

export const insertIntro = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[],
  headerPosition?: number,
) => {
  const newMessages = messages;
  const intro = ({ type: 'channel.intro' } as unknown) as StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;

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
        if (messages[i + 1] && messages[i + 1].type === 'message.date') continue;
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

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

export const getGroupStyles = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  previousMessage: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  nextMessage: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
  noGroupByUser: boolean,
): GroupStyle => {
  if (message.type === 'message.date') return '';
  if (message.type === 'channel.event') return '';
  if (message.type === 'channel.intro') return '';

  if (noGroupByUser || message.attachments?.length !== 0) return 'single';

  const isTopMessage =
    !previousMessage ||
    previousMessage.type === 'channel.intro' ||
    previousMessage.type === 'message.date' ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'channel.event' ||
    previousMessage.attachments?.length !== 0 ||
    message.user?.id !== previousMessage.user?.id ||
    previousMessage.type === 'error' ||
    previousMessage.deleted_at;

  const isBottomMessage =
    !nextMessage ||
    nextMessage.type === 'message.date' ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'channel.event' ||
    nextMessage.type === 'channel.intro' ||
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
