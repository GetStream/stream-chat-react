import deepequal from 'react-fast-compare';

import { EMOJI_REGEX } from './emojiRegex';

import type {
  LocalMessage,
  MessageResponse,
  StreamChat,
  UserMuteResponse,
  UserResponse,
} from 'stream-chat';
import type { MessageProps } from './types';
import type { MessageContextValue } from '../../context';
import type { StreamTFunction } from '../../i18n/types';

/**
 * Calls `func` with `args` and returns the result when it is a string, otherwise null.
 *
 * @param func - Function returning a notification message. Null is returned when not a function.
 * @param args - Arguments for `func`. A non-array value is wrapped in an array.
 * @returns The string `func` returned, or null.
 */
export const validateAndGetMessage = <T extends unknown[]>(
  func: (...args: T) => unknown,
  args: T,
) => {
  if (!func || typeof func !== 'function') return null;

  // Tests pass a single argument rather than an array.
  if (!Array.isArray(args)) {
    args = [args] as unknown as T;
  }

  const returnValue = func(...args);

  if (typeof returnValue !== 'string') return null;

  return returnValue;
};

/**
 * Whether the author of the message is muted.
 *
 * @param message - Message whose author is checked.
 * @param mutes - Muted users. False is returned when it is missing.
 * @returns True when the author is among the muted users.
 */
export const isUserMuted = (message: LocalMessage, mutes?: UserMuteResponse[]) => {
  if (!mutes || !message) return false;

  return mutes.some(({ target }) => target?.id === message.user?.id);
};

/** `MessageActionSetItem['type']`s that a thread reply does not support. */
export const ACTIONS_NOT_WORKING_IN_THREAD: string[] = ['pin', 'reply', 'markUnread'];

function areMessagesEqual(prevMessage: LocalMessage, nextMessage: LocalMessage): boolean {
  if (prevMessage === nextMessage) return true;

  const areBaseMessagesEqual = (prevMessage: LocalMessage, nextMessage: LocalMessage) =>
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.attachments === nextMessage.attachments &&
    prevMessage.latest_reactions === nextMessage.latest_reactions &&
    prevMessage.own_reactions === nextMessage.own_reactions &&
    prevMessage.reaction_groups === nextMessage.reaction_groups &&
    prevMessage.shared_location === nextMessage.shared_location &&
    prevMessage.pinned === nextMessage.pinned &&
    prevMessage.reply_count === nextMessage.reply_count &&
    prevMessage.show_in_channel === nextMessage.show_in_channel &&
    prevMessage.status === nextMessage.status &&
    prevMessage.text === nextMessage.text &&
    prevMessage.type === nextMessage.type &&
    prevMessage.updated_at === nextMessage.updated_at &&
    prevMessage.user?.updated_at === nextMessage.user?.updated_at;

  return (
    areBaseMessagesEqual(prevMessage, nextMessage) &&
    Boolean(prevMessage.quoted_message) === Boolean(nextMessage.quoted_message) &&
    ((!prevMessage.quoted_message && !nextMessage.quoted_message) ||
      areBaseMessagesEqual(
        prevMessage.quoted_message as LocalMessage,
        nextMessage.quoted_message as LocalMessage,
      ))
  );
}

export const areMessagePropsEqual = (
  prevProps: MessageProps & {
    showDetailedReactions?: boolean;
  },
  nextProps: MessageProps & {
    showDetailedReactions?: boolean;
  },
) => {
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;

  // The message UI component itself is not compared here: it is resolved from
  // `ComponentContext`, and context updates re-render consumers regardless of `React.memo`.
  if (nextProps.showDetailedReactions !== prevProps.showDetailedReactions) {
    return false;
  }

  if (nextProps.closeReactionSelectorOnClick !== prevProps.closeReactionSelectorOnClick) {
    return false;
  }

  const messagesAreEqual = areMessagesEqual(prevMessage, nextMessage);
  if (!messagesAreEqual) return false;

  const deepEqualProps =
    deepequal(nextProps.readBy, prevProps.readBy) &&
    deepequal(nextProps.deliveredTo, prevProps.deliveredTo) &&
    deepequal(nextProps.highlighted, prevProps.highlighted) &&
    deepequal(nextProps.groupStyles, prevProps.groupStyles) && // depends on neighboring messages
    deepequal(nextProps.lastReceivedId, prevProps.lastReceivedId);

  if (!deepEqualProps) return false;

  return (
    prevProps.messageListRect === nextProps.messageListRect // MessageList wrapper layout changes
  );
};

export const areMessageUIPropsEqual = (
  prevProps: MessageContextValue & {
    showDetailedReactions?: boolean;
  },
  nextProps: MessageContextValue & {
    showDetailedReactions?: boolean;
  },
) => {
  const { lastReceivedId: prevLastReceivedId, message: prevMessage } = prevProps;
  const { lastReceivedId: nextLastReceivedId, message: nextMessage } = nextProps;

  if (prevProps.highlighted !== nextProps.highlighted) return false;
  if (prevProps.endOfGroup !== nextProps.endOfGroup) return false;
  if (prevProps.readBy?.length !== nextProps.readBy?.length) return false;
  if (prevProps.deliveredTo?.length !== nextProps.deliveredTo?.length) return false;
  if (prevProps.groupStyles !== nextProps.groupStyles) return false;

  if (prevProps.showDetailedReactions !== nextProps.showDetailedReactions) {
    return false;
  }

  if (
    (prevMessage.id === prevLastReceivedId || prevMessage.id === nextLastReceivedId) &&
    prevLastReceivedId !== nextLastReceivedId
  ) {
    return false;
  }

  return areMessagesEqual(prevMessage, nextMessage);
};

export const messageHasReactions = (message?: LocalMessage) =>
  Object.values(message?.reaction_groups ?? {}).some(({ count }) => count > 0);

export const messageHasQuotedMessage = (message?: LocalMessage) =>
  !!message?.quoted_message;

export const messageHasAttachments = (message?: LocalMessage) =>
  !!message?.attachments && !!message.attachments.length;

export const messageHasSingleAttachment = (message?: LocalMessage) =>
  message?.attachments?.length === 1;

export const messageHasGiphyAttachment = (message?: LocalMessage) =>
  !!message?.attachments?.some((att) => att.type === 'giphy');

export const getImages = (message?: MessageResponse) => {
  if (!message?.attachments) {
    return [];
  }
  return message.attachments.filter((item) => item.type === 'image');
};

export const getNonImageAttachments = (message?: MessageResponse) => {
  if (!message?.attachments) {
    return [];
  }
  return message.attachments.filter((item) => item.type !== 'image');
};

export interface TooltipUsernameMapper {
  (user: UserResponse): string;
}

/**
 * Default tooltip username mapper.
 *
 * @param user - User to map.
 * @returns The user's name, falling back to the ID.
 */
export const mapToUserNameOrId: TooltipUsernameMapper = (user) => user.name || user.id;

export const getReadByTooltipText = (
  users: UserResponse[],
  t: StreamTFunction,
  client: StreamChat,
  tooltipUserNameMapper: TooltipUsernameMapper,
) => {
  let outStr = '';

  if (!t) {
    throw new Error(
      'getReadByTooltipText was called, but translation function is not available',
    );
  }

  if (!tooltipUserNameMapper) {
    throw new Error(
      'getReadByTooltipText was called, but tooltipUserNameMapper function is not available',
    );
  }
  // Exclude the current user so `restLength` does not count it.
  const otherUsers = users
    .filter((item) => item && client?.user && item.id !== client.user.id)
    .map(tooltipUserNameMapper);

  const slicedArr = otherUsers.slice(0, 5);
  const restLength = otherUsers.length - slicedArr.length;

  if (slicedArr.length === 1) {
    outStr = `${slicedArr[0]} `;
  } else if (slicedArr.length === 2) {
    // Two users: "bob and sam".
    outStr = t(
      'message.and.withFirstUserAndSecondUser.label',
      '{{ firstUser }} and {{ secondUser }}',
      {
        firstUser: slicedArr[0],
        secondUser: slicedArr[1],
      },
    );
  } else if (slicedArr.length > 2) {
    // Three or more: when all fit, the last one follows ", and" (Oxford comma); otherwise an
    // "and N more" suffix follows.
    if (restLength === 0) {
      // Splice out the last user to display it separately.
      const [lastUser] = slicedArr.splice(slicedArr.length - 1, 1);
      outStr = t(
        'message.and.withCommaSeparatedUsersAndLastUser.label',
        '{{ commaSeparatedUsers }}, and {{ lastUser }}',
        {
          commaSeparatedUsers: slicedArr.join(', '),
          lastUser,
        },
      );
    } else {
      outStr = t(
        'message.more.label',
        '{{ commaSeparatedUsers }} and {{ moreCount }} more',
        {
          commaSeparatedUsers: slicedArr.join(', '),
          moreCount: restLength,
        },
      );
    }
  }

  return outStr;
};

export const countEmojis = (text?: string) => {
  const matches = text?.match(EMOJI_REGEX);
  return matches ? matches.length : 0;
};

export const messageTextHasEmojisOnly = (message: LocalMessage) => {
  if (!message.text) return false;

  const noEmojis = message.text.replace(EMOJI_REGEX, '');
  const noSpace = noEmojis.replace(/[\s\n]/gm, '');

  return !noSpace;
};

export const isMessageErrorRetryable = (message: LocalMessage) =>
  message.status === 'failed' && message.error?.status !== 403;

export const isNetworkSendFailure = (message: Pick<LocalMessage, 'error' | 'status'>) =>
  message.status === 'failed' && message.error?.status === 0;

export const isMessageBounced = (message: Pick<LocalMessage, 'type' | 'moderation'>) =>
  message.type === 'error' && message.moderation?.action === 'bounce';

export const isMessageBlocked = (
  message: Pick<LocalMessage, 'type' | 'moderation' | 'shadowed'>,
) =>
  message.shadowed ||
  (message.type === 'error' && message.moderation?.action === 'remove');

export const isMessageDeleted = (message: LocalMessage): boolean =>
  Boolean(
    message.deleted_at != null || message.type === 'deleted' || message.deleted_for_me,
  );

export const isMessageEdited = (message: Pick<LocalMessage, 'message_text_updated_at'>) =>
  message.message_text_updated_at != null;
