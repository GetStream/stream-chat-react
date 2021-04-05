/* eslint-disable no-continue */
import { isDate } from '../../context/TranslationContext';

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
