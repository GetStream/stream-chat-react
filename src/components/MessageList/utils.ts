/* eslint-disable no-continue */
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

    //@ts-expect-error
    const messageDate = message.created_at.toDateString();
    let prevMessageDate = messageDate;

    if (i > 0 && !disableDateSeparator) {
      //@ts-expect-error
      prevMessageDate = messages[i - 1].created_at.toDateString();
    }

    if (!unread) {
      //@ts-expect-error
      unread = lastRead && new Date(lastRead) < message.created_at;

      // do not show date separator for current user's messages
      //@ts-expect-error
      if (!disableDateSeparator && unread && message.user.id !== userID) {
        //@ts-expect-error
        newMessages.push({
          date: message.created_at,
          id: message.id,
          type: 'message.date',
          unread,
        });
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
        //@ts-expect-error
        {
          date: message.created_at,
          id: message.id,
          type: 'message.date',
        },
        message,
      );
    } else {
      newMessages.push(message);
    }
  }

  return newMessages;
};
