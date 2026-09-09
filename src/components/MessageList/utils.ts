import { nanoid } from 'nanoid';

import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { isMessageEdited } from '../Message/utils';
import { toDate, toMs } from '../../utils/timestamps';

import type {
  Channel,
  LocalMessage,
  MessageLabel,
  UnreadSnapshotState,
} from 'stream-chat';

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro;
  id: string;
};

type DateSeparatorMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.date;
  /** Wire timestamp (unix nanoseconds) of the message this separator precedes. */
  date: number;
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
  /** Wire timestamp (unix nanoseconds) after which everything is considered unread. */
  lastRead?: number | null;
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
/**
 * The day a message belongs to, as the key the separator logic compares consecutive messages on.
 *
 * Three outcomes, mirroring what the pre-wire-timestamp code produced by calling `toDateString()`
 * on whatever `created_at` held: no timestamp reads as `''`, an unreadable one as `'Invalid Date'`,
 * and a real one as its local date. The distinction matters — an unreadable timestamp is an unknown
 * day, so it counts as a boundary against its neighbours, whereas a missing one does not.
 */
const toDayKey = (timestamp?: number | null): string => {
  if (timestamp == null) return '';
  return toDate(timestamp)?.toDateString() ?? 'Invalid Date';
};

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

  const lastReadDate = toDate(lastRead);
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
    // `created_at` is a unix-NANOSECOND number on the wire, not a `Date` — `nsToDate` is the only
    // safe way to read it. Feeding the raw number to `Date`/dayjs lands out of range (a current
    // nanosecond value is ~1.79e18 against `Date`'s ~8.64e15 ceiling), which is why an untranslated
    // value reaches `DateSeparator` and throws on `.toISOString()` instead of failing a type check.
    const messageCreatedAt = toDate(message.created_at);
    const messageDate = toDayKey(message.created_at);
    const previousMessage = messages[i - 1];
    let prevMessageDate = messageDate;

    if (enableDateSeparator && previousMessage?.created_at != null) {
      prevMessageDate = toDayKey(previousMessage.created_at);
    }

    if (!unread && !hideNewMessageSeparator) {
      unread =
        (!!lastReadDate && !!messageCreatedAt && lastReadDate < messageCreatedAt) ||
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

export const makeDateMessageId = (date?: string | Date | number) => {
  let idSuffix;
  try {
    // A wire timestamp (a number) is used as-is: the epoch is `0`, which the old truthiness check
    // would have sent down the `nanoid()` path and produced an unstable id for. A non-finite one
    // carries no instant to key on, so it still falls back.
    if (typeof date === 'number') {
      idSuffix = Number.isFinite(date) ? date : nanoid();
    } else {
      idSuffix = !date ? nanoid() : date instanceof Date ? date.toISOString() : date;
    }
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
    // Same wire-timestamp conversion as above: `headerPosition` is epoch milliseconds, so the
    // comparisons below need milliseconds, not the raw nanosecond value.
    const messageTime =
      toDate((messages[i] as LocalMessage).created_at)?.getTime() ?? null;

    const nextMessageTime =
      toDate((messages[i + 1] as LocalMessage)?.created_at)?.getTime() ?? null;

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

// Allocation-free, early-exiting emptiness check. Avoids the throwaway array
// that `Object.keys(obj).length > 0` allocates per message inside getGroupStyles.
const isNonEmptyRecord = (record: Record<string, unknown>) => {
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) return true;
  }
  return false;
};

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
    (message.reaction_groups && isNonEmptyRecord(message.reaction_groups)) ||
    isMessageEdited(previousMessage) ||
    // `maxTimeBetweenGroupedMessages` is milliseconds while `created_at` is nanoseconds, so both
    // sides have to be brought to ms — `new Date(<ns>).getTime()` was comparing garbage.
    (maxTimeBetweenGroupedMessages !== undefined &&
      previousMessage.created_at &&
      message.created_at &&
      (toMs(message.created_at) ?? 0) - (toMs(previousMessage.created_at) ?? 0) >
        maxTimeBetweenGroupedMessages);

  const isBottomMessage =
    !nextMessage ||
    isIntroMessage(nextMessage) ||
    isDateSeparatorMessage(nextMessage) ||
    nextMessage.type === 'system' ||
    nextMessage.type === 'error' ||
    nextMessage.attachments?.length !== 0 ||
    message.user?.id !== nextMessage.user?.id ||
    (nextMessage.reaction_groups && isNonEmptyRecord(nextMessage.reaction_groups)) ||
    isMessageEdited(message) ||
    (maxTimeBetweenGroupedMessages !== undefined &&
      nextMessage.created_at &&
      message.created_at &&
      (toMs(nextMessage.created_at) ?? 0) - (toMs(message.created_at) ?? 0) >
        maxTimeBetweenGroupedMessages);

  if (!isTopMessage && !isBottomMessage) {
    if (message.type === 'error') return 'single';
    return 'middle';
  }

  if (isBottomMessage) {
    if (isTopMessage || message.type === 'error') return 'single';
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
    // `date` is the wire timestamp the separator was built from. It used to be a `Date`, and
    // leaving an `isDate` check here made this guard answer `false` for every separator — which
    // silently disables the "no two separators in a row" rule and `isLocalMessage`.
    typeof (message as DateSeparatorMessage).date === 'number'
  );
}

export function isLocalMessage(message: unknown): message is LocalMessage {
  return !isDateSeparatorMessage(message) && !isIntroMessage(message);
}

export function isDeletedMessage(
  message: unknown,
): message is LocalMessage & { type: 'deleted' } {
  return !!message && (message as LocalMessage).type === 'deleted';
}

// todo: simplify the logic
export const getIsFirstUnreadMessage = ({
  channel,
  firstUnreadMessageId,
  isFirstMessage,
  lastReadAt,
  lastReadMessageId,
  message,
  previousMessage,
  unreadCount = 0,
}: UnreadSnapshotState & {
  channel?: Channel;
  isFirstMessage: boolean;
  message: LocalMessage;
  previousMessage?: RenderedMessage;
}) => {
  // prevent showing unread indicator in threads
  if (message.parent_id || !channel) return false;
  // unread separator is snapshot-driven; if snapshot says there are no unread messages,
  // the separator should not be rendered.
  if (!unreadCount) return false;

  // Both are wire timestamps (unix nanoseconds): `lastReadAt` is `number | null` on
  // `UnreadSnapshotState`, so `.getTime()` throws on it, and `new Date(<ns>)` is out of range.
  const createdAtTimestamp = toDate(message.created_at)?.getTime();
  const lastReadTimestamp = toDate(lastReadAt)?.getTime();

  const messageIsUnread =
    !!createdAtTimestamp && !!lastReadTimestamp && createdAtTimestamp > lastReadTimestamp;

  const previousMessageIsLastRead =
    !!lastReadMessageId && lastReadMessageId === previousMessage?.id;

  return (
    firstUnreadMessageId === message.id ||
    (messageIsUnread && (isFirstMessage || previousMessageIsLastRead))
  );
};
