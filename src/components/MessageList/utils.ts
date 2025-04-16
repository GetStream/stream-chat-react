import { nanoid } from 'nanoid';

import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { isMessageEdited } from '../Message/utils';
import { isDate } from '../../i18n';

import type { LocalMessage, MessageLabel, UserResponse } from 'stream-chat';

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro;
  id: string;
};

type DateSeparatorMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.date;
  date: Date;
  id: string;
  type: MessageLabel;
  unread: boolean;
};

export type RenderedMessage = LocalMessage | DateSeparatorMessage | IntroMessage;

type ProcessMessagesContext = {
  /** the connected user ID */
  userId: string;
  /** Enable date separator */
  enableDateSeparator?: boolean;
  /** Enable deleted messages to be filtered out of resulting message list */
  hideDeletedMessages?: boolean;
  /** Disable date separator display for unread incoming messages */
  hideNewMessageSeparator?: boolean;
  /** Sets the threshold after everything is considered unread */
  lastRead?: Date | null;
};

export type ProcessMessagesParams = ProcessMessagesContext & {
  messages: LocalMessage[];
  reviewProcessedMessage?: (params: {
    /** array of messages representing the changes applied around a given processed message */
    changes: RenderedMessage[];
    /** configuration params and information forwarded from `processMessages` */
    context: ProcessMessagesContext;
    /** index of the processed message in the original messages array */
    index: number;
    /** array of messages retrieved from the back-end */
    messages: LocalMessage[];
    /** newly built array of messages to be later rendered */
    processedMessages: RenderedMessage[];
  }) => LocalMessage[];
  /** Signals whether to separate giphy preview as well as used to set the giphy preview state */
  setGiphyPreviewMessage?: React.Dispatch<React.SetStateAction<LocalMessage | undefined>>;
};

/**
 * processMessages - Transform the input message list according to config parameters
 *
 * Inserts date separators btw. messages created on different dates or before unread incoming messages. By default:
 * - enabled in main message list
 * - disabled in virtualized message list
 * - disabled in thread
 *
 * Allows to filter out deleted messages, contolled by hideDeletedMessages param. This is disabled by default.
 *
 * Sets Giphy preview message for VirtualizedMessageList
 *
 * The only required params are messages and userId, the rest are config params:
 *
 * @return {LocalMessage[]} Transformed list of messages
 */
export const processMessages = (params: ProcessMessagesParams) => {
  const { messages, reviewProcessedMessage, setGiphyPreviewMessage, ...context } = params;
  const {
    enableDateSeparator,
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    userId,
  } = context;

  let unread = false;
  let ephemeralMessagePresent = false;
  let lastDateSeparator;
  const newMessages: RenderedMessage[] = [];

  for (let i = 0; i < messages.length; i += 1) {
    const message = messages[i];

    if (hideDeletedMessages && message.type === 'deleted') {
      continue;
    }

    if (
      setGiphyPreviewMessage &&
      message.type === 'ephemeral' &&
      message.command === 'giphy'
    ) {
      ephemeralMessagePresent = true;
      setGiphyPreviewMessage(message);
      continue;
    }

    const changes: RenderedMessage[] = [];
    const messageDate =
      (message.created_at &&
        isDate(message.created_at) &&
        message.created_at.toDateString()) ||
      '';
    const previousMessage = messages[i - 1];
    let prevMessageDate = messageDate;

    if (
      enableDateSeparator &&
      previousMessage?.created_at &&
      isDate(previousMessage.created_at)
    ) {
      prevMessageDate = previousMessage.created_at.toDateString();
    }

    if (!unread && !hideNewMessageSeparator) {
      unread =
        (lastRead && message.created_at && new Date(lastRead) < message.created_at) ||
        false;

      // do not show date separator for current user's messages
      if (enableDateSeparator && unread && message.user?.id !== userId) {
        changes.push({
          customType: CUSTOM_MESSAGE_TYPE.date,
          date: message.created_at,
          id: makeDateMessageId(message.created_at),
          unread,
        } as DateSeparatorMessage);
      }
    }

    if (
      enableDateSeparator &&
      (i === 0 || // always put date separator before the first message
        messageDate !== prevMessageDate || // add date separator btw. 2 messages created on different date
        // if hiding deleted messages replace the previous deleted message(s) with A separator if the last rendered message was created on different date
        (hideDeletedMessages &&
          previousMessage?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      !isDateSeparatorMessage(changes[changes.length - 1]) // do not show two date separators in a row)
    ) {
      lastDateSeparator = messageDate;

      changes.push(
        {
          customType: CUSTOM_MESSAGE_TYPE.date,
          date: message.created_at,
          id: makeDateMessageId(message.created_at),
        } as DateSeparatorMessage,
        message,
      );
    } else {
      changes.push(message);
    }

    newMessages.push(
      ...(reviewProcessedMessage?.({
        changes,
        context,
        index: i,
        messages,
        processedMessages: newMessages,
      }) || changes),
    );
  }

  // clean up the giphy preview component state after a Cancel action
  if (setGiphyPreviewMessage && !ephemeralMessagePresent) {
    setGiphyPreviewMessage(undefined);
  }

  return newMessages;
};

export const makeIntroMessage = (): IntroMessage => ({
  customType: CUSTOM_MESSAGE_TYPE.intro,
  id: nanoid(),
});

export const makeDateMessageId = (date?: string | Date) => {
  let idSuffix;
  try {
    idSuffix = !date ? nanoid() : date instanceof Date ? date.toISOString() : date;
  } catch (e) {
    idSuffix = nanoid();
  }
  return `${CUSTOM_MESSAGE_TYPE.date}-${idSuffix}`;
};

// fast since it usually iterates just the last few messages
export const getLastReceived = (messages: RenderedMessage[]) => {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if ((messages[i] as LocalMessage).status === 'received') {
      return messages[i].id;
    }
  }

  return null;
};

export const getReadStates = (
  messages: LocalMessage[],
  read: Record<string, { last_read: Date; user: UserResponse }> = {},
  returnAllReadData: boolean,
) => {
  // create object with empty array for each message id
  const readData: Record<string, Array<UserResponse>> = {};

  Object.values(read).forEach((readState) => {
    if (!readState.last_read) return;

    let userLastReadMsgId: string | undefined;

    // loop messages sent by current user and add read data for other users in channel
    messages.forEach((msg) => {
      if (msg.created_at && msg.created_at < readState.last_read) {
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

export const insertIntro = (messages: RenderedMessage[], headerPosition?: number) => {
  const newMessages = messages;
  const intro = makeIntroMessage();

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
    const messageTime = isDate((messages[i] as LocalMessage).created_at)
      ? (messages[i] as LocalMessage).created_at.getTime()
      : null;

    const nextMessageTime = isDate((messages[i + 1] as LocalMessage).created_at)
      ? (messages[i + 1] as LocalMessage).created_at.getTime()
      : null;

    // header position is smaller than message time so comes after;
    if (messageTime && messageTime < headerPosition) {
      // if header position is also smaller than message time continue;
      if (nextMessageTime && nextMessageTime < headerPosition) {
        if (messages[i + 1] && isDateSeparatorMessage(messages[i + 1])) continue;
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

export const getGroupStyles = (
  message: RenderedMessage,
  previousMessage: RenderedMessage,
  nextMessage: RenderedMessage,
  noGroupByUser: boolean,
  maxTimeBetweenGroupedMessages?: number,
): GroupStyle => {
  if (isDateSeparatorMessage(message) || isIntroMessage(message)) return '';

  if (noGroupByUser || message.attachments?.length !== 0) return 'single';

  const isTopMessage =
    !previousMessage ||
    isIntroMessage(previousMessage) ||
    isDateSeparatorMessage(previousMessage) ||
    previousMessage.type === 'system' ||
    previousMessage.type === 'error' ||
    previousMessage.attachments?.length !== 0 ||
    message.user?.id !== previousMessage.user?.id ||
    previousMessage.deleted_at ||
    (message.reaction_groups && Object.keys(message.reaction_groups).length > 0) ||
    isMessageEdited(previousMessage) ||
    (maxTimeBetweenGroupedMessages !== undefined &&
      previousMessage.created_at &&
      message.created_at &&
      new Date(message.created_at).getTime() -
        new Date(previousMessage.created_at).getTime() >
        maxTimeBetweenGroupedMessages);

  const isBottomMessage =
    !nextMessage ||
    isIntroMessage(nextMessage) ||
    isDateSeparatorMessage(nextMessage) ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'error' ||
    nextMessage.attachments?.length !== 0 ||
    message.user?.id !== nextMessage.user?.id ||
    nextMessage.deleted_at ||
    (nextMessage.reaction_groups &&
      Object.keys(nextMessage.reaction_groups).length > 0) ||
    isMessageEdited(message) ||
    (maxTimeBetweenGroupedMessages !== undefined &&
      nextMessage.created_at &&
      message.created_at &&
      new Date(nextMessage.created_at).getTime() -
        new Date(message.created_at).getTime() >
        maxTimeBetweenGroupedMessages);

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

// "Probably" included, because it may happen that the last page was returned and it has exactly the size of the limit
// but the back-end cannot provide us with information on whether it has still more messages in the DB
// FIXME: once the pagination state is moved from Channel to MessageList, these should be moved as well.
//  The MessageList should have configurable the limit for performing the requests.
//  This parameter would then be used within these functions
export const hasMoreMessagesProbably = (returnedCountMessages: number, limit: number) =>
  returnedCountMessages >= limit;

// @deprecated
export const hasNotMoreMessages = (returnedCountMessages: number, limit: number) =>
  returnedCountMessages < limit;

export function isIntroMessage(message: unknown): message is IntroMessage {
  return (message as IntroMessage).customType === CUSTOM_MESSAGE_TYPE.intro;
}

export function isDateSeparatorMessage(
  message: unknown,
): message is DateSeparatorMessage {
  return (
    message !== null &&
    typeof message === 'object' &&
    (message as DateSeparatorMessage).customType === CUSTOM_MESSAGE_TYPE.date &&
    isDate((message as DateSeparatorMessage).date)
  );
}

export function isLocalMessage(message: unknown): message is LocalMessage {
  return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}

export const getIsFirstUnreadMessage = ({
  firstUnreadMessageId,
  isFirstMessage,
  lastReadDate,
  lastReadMessageId,
  message,
  previousMessage,
  unreadMessageCount = 0,
}: {
  isFirstMessage: boolean;
  message: LocalMessage;
  firstUnreadMessageId?: string;
  lastReadDate?: Date;
  lastReadMessageId?: string;
  previousMessage?: RenderedMessage;
  unreadMessageCount?: number;
}) => {
  // prevent showing unread indicator in threads
  if (message.parent_id) return false;

  const createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
  const lastReadTimestamp = lastReadDate?.getTime();

  const messageIsUnread =
    !!createdAtTimestamp && !!lastReadTimestamp && createdAtTimestamp > lastReadTimestamp;

  const previousMessageIsLastRead =
    !!lastReadMessageId && lastReadMessageId === previousMessage?.id;

  return (
    firstUnreadMessageId === message.id ||
    (!!unreadMessageCount &&
      messageIsUnread &&
      (isFirstMessage || previousMessageIsLastRead))
  );
};
