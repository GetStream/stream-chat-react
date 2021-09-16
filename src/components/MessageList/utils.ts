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
} from '../../types/types';

import type { StreamMessage } from '../../context/ChannelStateContext';

type ProcessMessagesParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  disableDateSeparator: boolean;
  hideDeletedMessages: boolean;
  hideNewMessageSeparator: boolean;
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  userId: string;
  lastRead?: Date | null;
  separateGiphyPreview?: boolean;
  setGiphyPreviewMessage?: React.Dispatch<
    React.SetStateAction<StreamMessage<At, Ch, Co, Ev, Me, Re, Us> | undefined>
  >;
  threadList?: boolean;
};

export const processMessages = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  params: ProcessMessagesParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    disableDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    messages,
    separateGiphyPreview,
    setGiphyPreviewMessage,
    threadList,
    userId,
  } = params;

  let unread = false;
  let ephemeralMessagePresent = false;
  let lastDateSeparator;
  const newMessages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (
      separateGiphyPreview &&
      setGiphyPreviewMessage &&
      message.type === 'ephemeral' &&
      message.command === 'giphy'
    ) {
      ephemeralMessagePresent = true;
      setGiphyPreviewMessage(message);
      continue;
    }

    const messageDate =
      (message.created_at && isDate(message.created_at) && message.created_at.toDateString()) || '';
    let prevMessageDate = messageDate;
    const previousMessage = messages[i - 1];

    if (
      i > 0 &&
      !disableDateSeparator &&
      !threadList &&
      previousMessage.created_at &&
      isDate(previousMessage.created_at)
    ) {
      prevMessageDate = previousMessage.created_at.toDateString();
    }

    if (!unread && !hideNewMessageSeparator && !threadList) {
      unread = (lastRead && message.created_at && new Date(lastRead) < message.created_at) || false;

      // do not show date separator for current user's messages
      if (!disableDateSeparator && unread && message.user?.id !== userId) {
        newMessages.push({
          customType: 'message.date',
          date: message.created_at,
          id: message.id,
          unread,
        } as StreamMessage<At, Ch, Co, Ev, Me, Re, Us>);
      }
    }

    if (
      !disableDateSeparator &&
      !threadList &&
      (i === 0 ||
        messageDate !== prevMessageDate ||
        (hideDeletedMessages &&
          messages[i - 1]?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      newMessages?.[newMessages.length - 1]?.customType !== 'message.date' // do not show two date separators in a row
    ) {
      lastDateSeparator = messageDate;

      newMessages.push(
        {
          customType: 'message.date',
          date: message.created_at,
          id: message.id,
        } as StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  // clean up the giphy preview component state after a Cancel action
  if (separateGiphyPreview && !ephemeralMessagePresent) {
    setGiphyPreviewMessage?.(undefined);
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
  returnAllReadData: boolean,
) => {
  // create object with empty array for each message id
  const readData: Record<string, Array<UserResponse<Us>>> = {};

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
  const intro = ({ customType: 'channel.intro' } as unknown) as StreamMessage<
    At,
    Ch,
    Co,
    Ev,
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
