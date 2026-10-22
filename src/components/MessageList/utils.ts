import { nanoid } from 'nanoid';

import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { isMessageEdited } from '../Message/utils';
import { isDate } from '../../i18n';

import type {
  Channel,
  LocalMessage,
  TimestampNS,
  UnreadSnapshotState,
} from 'stream-chat';
import { convertTimestampToDate, nsToMs } from 'stream-chat';

type IntroMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.intro;
  id: string;
};

type DateSeparatorMessage = {
  customType: typeof CUSTOM_MESSAGE_TYPE.date;
  /** A `Date`, not the numeric timestamp: `isDateSeparatorMessage` requires one. */
  date: Date;
  id: string;
  /**
   * Set only on the unread separator. Separators carry no `type`, so consumers narrow the union
   * with `isDateSeparatorMessage` first.
   */
  unread?: boolean;
};

export type RenderedMessage = LocalMessage | DateSeparatorMessage | IntroMessage;

type ProcessMessagesContext = {
  /** ID of the connected user. */
  userId: string;
  /** Filters deleted messages out of the result. */
  hideDeletedMessages?: boolean;
  /** Disables the date separator shown for unread incoming messages. */
  hideNewMessageSeparator?: boolean;
  /**
   * Messages created after this timestamp count as unread. Unix nanoseconds, as
   * `channel.lastRead()` returns.
   */
  lastRead?: TimestampNS | null;
  /** Inserts date separators between messages posted on different days. */
  withDateSeparator?: boolean;
};

export type ProcessMessagesParams = ProcessMessagesContext & {
  messages: LocalMessage[];
  reviewProcessedMessage?: (params: {
    /** Items built for the processed message: its separator, if any, then the message itself. */
    changes: RenderedMessage[];
    /** Config params forwarded from `processMessages`. */
    context: ProcessMessagesContext;
    /** Index of the processed message in `messages`. */
    index: number;
    /** The input messages. */
    messages: LocalMessage[];
    /** Items built so far, before this message's `changes`. */
    processedMessages: RenderedMessage[];
  }) => LocalMessage[];
  /**
   * Receives the ephemeral giphy preview message, which is left out of the result, or `undefined`
   * when there is none.
   */
  setGiphyPreviewMessage?: React.Dispatch<React.SetStateAction<LocalMessage | undefined>>;
};

/**
 * Prepares messages for rendering: inserts date separators between messages posted on different
 * days and before the first unread message, and optionally drops deleted ones. The ephemeral giphy
 * preview is left out and handed to `setGiphyPreviewMessage`. `MessageList` enables date
 * separators by default, `VirtualizedMessageList` does not.
 *
 * @param params - Only `messages` and `userId` are required.
 * @returns The messages to render, with separators inserted.
 */
export const processMessages = (params: ProcessMessagesParams) => {
  const { messages, reviewProcessedMessage, setGiphyPreviewMessage, ...context } = params;
  const {
    hideDeletedMessages,
    hideNewMessageSeparator,
    lastRead,
    userId,
    withDateSeparator,
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
    // `undefined` when the timestamp is unusable, so no separator is built for that message.
    const messageCreatedAt = convertTimestampToDate(message.created_at);
    const messageDate = messageCreatedAt ? messageCreatedAt.toDateString() : '';
    const previousMessage = messages[i - 1];
    // `''` when the previous message has no usable timestamp, so the current one still gets a
    // separator.
    const previousCreatedAt = withDateSeparator
      ? convertTimestampToDate(previousMessage?.created_at)
      : undefined;
    const prevMessageDate = previousCreatedAt ? previousCreatedAt.toDateString() : '';

    if (!unread && !hideNewMessageSeparator) {
      unread =
        (lastRead != null &&
          message.created_at != null &&
          lastRead < message.created_at) ||
        false;

      // No unread date separator for the current user's messages.
      if (
        withDateSeparator &&
        unread &&
        messageCreatedAt &&
        message.user?.id !== userId
      ) {
        const separator: DateSeparatorMessage = {
          customType: CUSTOM_MESSAGE_TYPE.date,
          date: messageCreatedAt,
          id: makeDateMessageId(messageCreatedAt),
          unread,
        };
        changes.push(separator);
      }
    }

    if (
      withDateSeparator &&
      (i === 0 || // the first message always gets a separator
        messageDate !== prevMessageDate || // the date changed
        // Hidden deleted messages: add a separator if the last separator is for another date.
        (hideDeletedMessages &&
          previousMessage?.type === 'deleted' &&
          lastDateSeparator !== messageDate)) &&
      !isDateSeparatorMessage(changes[changes.length - 1]) // never two separators in a row
    ) {
      lastDateSeparator = messageDate;

      const separator: DateSeparatorMessage | undefined = messageCreatedAt && {
        customType: CUSTOM_MESSAGE_TYPE.date,
        date: messageCreatedAt,
        id: makeDateMessageId(messageCreatedAt),
      };
      changes.push(...(separator ? [separator] : []), message);
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

  // Clears the giphy preview state once no ephemeral giphy message remains (e.g. after Cancel).
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

/**
 * Returns the ID of the latest message with status `received`, or `null`. It scans from the end, so
 * it usually iterates only the last few messages.
 *
 * @param messages - Rendered messages, oldest first.
 * @returns The message ID, or `null` when none is found.
 */
export const getLastReceived = (messages: RenderedMessage[]) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if ((messages[i] as LocalMessage).status === 'received') {
      return messages[i].id;
    }
  }

  return null;
};

export const insertIntro = (
  messages: RenderedMessage[],
  headerPosition?: TimestampNS,
) => {
  const newMessages = messages;
  const intro = makeIntroMessage();

  // Without a header position the intro goes at the top.
  if (headerPosition == null) {
    newMessages.unshift(intro);
    return newMessages;
  }

  // An empty list holds only the intro.
  if (!newMessages.length) {
    newMessages.unshift(intro);
    return newMessages;
  }

  for (let i = 0; i < messages.length; i += 1) {
    const messageTime = (messages[i] as LocalMessage).created_at;

    const nextMessageTime = (messages[i + 1] as LocalMessage)?.created_at ?? null;

    // The message is older than the header position, so the intro comes after it.
    if (messageTime < headerPosition) {
      // Keep looking while the next message is also older.
      if (nextMessageTime != null && nextMessageTime < headerPosition) {
        if (messages[i + 1] && isDateSeparatorMessage(messages[i + 1])) continue;
      } else {
        newMessages.splice(i + 1, 0, intro);
        return newMessages;
      }
    }
  }

  // No message is older than the header position, so the intro precedes the whole list.
  newMessages.unshift(intro);
  return newMessages;
};

export type GroupStyle = '' | 'middle' | 'top' | 'bottom' | 'single';

// Allocation-free emptiness check; avoids the array `Object.keys(...)` allocates per message in
// `getGroupStyles`.
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
    (maxTimeBetweenGroupedMessages !== undefined &&
      // Nullish, not truthy: `0` is a valid timestamp (the epoch) and must not skip the cutoff.
      previousMessage.created_at != null &&
      message.created_at != null &&
      nsToMs(message.created_at - previousMessage.created_at) >
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
      nextMessage.created_at != null &&
      message.created_at != null &&
      nsToMs(nextMessage.created_at - message.created_at) >
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

// FIXME: once the pagination state is moved from Channel to MessageList, these should be moved as well.
//  The MessageList should have configurable the limit for performing the requests.
//  This parameter would then be used within these functions
/**
 * Whether more messages probably follow a page of `returnedCountMessages`. Only a guess: a last
 * page of exactly `limit` messages looks the same, and the back-end does not say if more exist.
 *
 * @param returnedCountMessages - Number of messages the request returned.
 * @param limit - Requested page size.
 * @returns Whether `returnedCountMessages` reaches `limit`.
 */
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
    isDate((message as DateSeparatorMessage).date)
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
  // No unread indicator in threads.
  if (message.parent_id || !channel) return false;
  // Snapshot-driven: no unread messages in the snapshot means no separator.
  if (!unreadCount) return false;

  const createdAtTimestamp = message.created_at;
  const lastReadTimestamp = lastReadAt;

  const messageIsUnread =
    createdAtTimestamp != null &&
    lastReadTimestamp != null &&
    createdAtTimestamp > lastReadTimestamp;

  const previousMessageIsLastRead =
    !!lastReadMessageId && lastReadMessageId === previousMessage?.id;

  return (
    firstUnreadMessageId === message.id ||
    (messageIsUnread && (isFirstMessage || previousMessageIsLastRead))
  );
};
