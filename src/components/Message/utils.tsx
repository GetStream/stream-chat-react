import deepequal from 'react-fast-compare';
import PropTypes from 'prop-types';
import type {
  Attachment,
  MessageResponse,
  Mute,
  UserResponse,
} from 'stream-chat';
import type {
  ChannelContextValue,
  MessageComponentProps,
  StreamChatReactUserType,
  TranslationContextValue,
} from 'types';

/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 */
export function validateAndGetMessage<T extends unknown[]>(
  func: (...args: T) => unknown,
  args: T,
): string | null {
  if (!func || typeof func !== 'function') return null;

  // below is due to tests passing a single argument
  // rather than an array.
  if (!(args instanceof Array)) {
    // @ts-expect-error
    args = [args];
  }

  const returnValue = func(...args);

  if (typeof returnValue !== 'string') return null;

  return returnValue;
}

/**
 * Tell if the owner of the current message is muted
 */
export function isUserMuted(message: MessageResponse, mutes?: Mute[]): boolean {
  if (!mutes || !message) {
    return false;
  }

  const userMuted = mutes.filter((el) => el.target.id === message.user?.id);
  return !!userMuted.length;
}

export const MESSAGE_ACTIONS = {
  delete: 'delete',
  edit: 'edit',
  flag: 'flag',
  mute: 'mute',
  pin: 'pin',
  react: 'react',
  reply: 'reply',
};

export const defaultPinPermissions = {
  commerce: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: false,
    user: false,
  },
  gaming: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: false,
    user: false,
  },
  livestream: {
    admin: true,
    anonymous: false,
    channel_member: false,
    channel_moderator: true,
    guest: false,
    member: false,
    moderator: true,
    owner: true,
    user: false,
  },
  messaging: {
    admin: true,
    anonymous: false,
    channel_member: true,
    channel_moderator: true,
    guest: false,
    member: true,
    moderator: true,
    owner: true,
    user: false,
  },
  team: {
    admin: true,
    anonymous: false,
    channel_member: true,
    channel_moderator: true,
    guest: false,
    member: true,
    moderator: true,
    owner: true,
    user: false,
  },
};

export interface Capabilities {
  canDelete?: boolean;
  canEdit?: boolean;
  canFlag?: boolean;
  canMute?: boolean;
  canPin?: boolean;
  canReact?: boolean;
  canReply?: boolean;
}

export function getMessageActions(
  actions: string[] | boolean,
  {
    canDelete,
    canEdit,
    canFlag,
    canMute,
    canPin,
    canReact,
    canReply,
  }: Capabilities,
): string[] {
  const messageActionsAfterPermission = [];
  let messageActions = [];

  // TODO: leftover from typescript conversions
  // the types suggest that actions will always be passed,
  // yet the implementation checks for actions
  if (actions && typeof actions === 'boolean') {
    // If value of actions is true, then populate all the possible values
    messageActions = Object.keys(MESSAGE_ACTIONS);
  } else if (actions && actions.length > 0) {
    messageActions = [...actions];
  } else {
    return [];
  }

  if (canDelete && messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.delete);
  }

  if (canEdit && messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.edit);
  }

  if (canFlag && messageActions.indexOf(MESSAGE_ACTIONS.flag) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.flag);
  }

  if (canMute && messageActions.indexOf(MESSAGE_ACTIONS.mute) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.mute);
  }

  if (canPin && messageActions.indexOf(MESSAGE_ACTIONS.pin) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.pin);
  }

  if (canReact && messageActions.indexOf(MESSAGE_ACTIONS.react) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.react);
  }

  if (canReply && messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.reply);
  }

  return messageActionsAfterPermission;
}

export type MessageEqualProps = Pick<
  MessageComponentProps,
  'message' | 'readBy' | 'groupStyles' | 'lastReceivedId' | 'messageListRect'
>;

export const areMessagePropsEqual = (
  props: MessageEqualProps,
  nextProps: MessageEqualProps,
): boolean =>
  // Message content is equal
  nextProps.message === props.message &&
  // Message was read by someone
  deepequal(nextProps.readBy, props.readBy) &&
  // Group style changes (it often happens that the last 3 messages of a channel have different group styles)
  deepequal(nextProps.groupStyles, props.groupStyles) &&
  // @ts-expect-error
  deepequal(nextProps.mutes, props.mutes) &&
  // Last message received in the channel changes
  deepequal(nextProps.lastReceivedId, props.lastReceivedId) &&
  // User toggles edit state
  // @ts-expect-error // TODO: fix
  nextProps.editing === props.editing &&
  // Message wrapper layout changes
  nextProps.messageListRect === props.messageListRect;

export const shouldMessageComponentUpdate = (
  props: MessageComponentProps,
  nextProps: MessageComponentProps,
): boolean =>
  // Component should only update if:
  !areMessagePropsEqual(props, nextProps);

export const messageHasReactions = (message?: MessageResponse) =>
  !!message?.latest_reactions && !!message.latest_reactions.length;

export const messageHasAttachments = (message?: MessageResponse) =>
  !!message?.attachments && !!message.attachments.length;

export const getImages = (message?: MessageResponse): Attachment[] => {
  if (!message?.attachments) {
    return [];
  }
  return message.attachments.filter((item) => item.type === 'image');
};

export const getNonImageAttachments = (
  message?: MessageResponse,
): Attachment[] => {
  if (!message?.attachments) {
    return [];
  }
  return message.attachments.filter((item) => item.type !== 'image');
};

export type ReadByUsers = Array<UserResponse<StreamChatReactUserType>>;

export const getReadByTooltipText = (
  users: ReadByUsers,
  t: TranslationContextValue['t'],
  client: ChannelContextValue['client'],
) => {
  let outStr = '';
  if (!t) {
    throw new Error(
      '`getReadByTooltipText was called, but translation function is not available`',
    );
  }
  // first filter out client user, so restLength won't count it
  const otherUsers = users
    .filter((item) => item && client?.user && item.id !== client.user.id)
    .map((item) => item.name || item.id);

  const slicedArr = otherUsers.slice(0, 5);
  const restLength = otherUsers.length - slicedArr.length;

  if (slicedArr.length === 1) {
    outStr = `${slicedArr[0]} `;
  } else if (slicedArr.length === 2) {
    // joins all with "and" but =no commas
    // example: "bob and sam"
    outStr = t('{{ firstUser }} and {{ secondUser }}', {
      firstUser: slicedArr[0],
      secondUser: slicedArr[1],
    });
  } else if (slicedArr.length > 2) {
    // joins all with commas, but last one gets ", and" (oxford comma!)
    // example: "bob, joe, sam and 4 more"
    if (restLength === 0) {
      // mutate slicedArr to remove last user to display it separately
      const lastUser = slicedArr.splice(slicedArr.length - 2, 1);
      outStr = t('{{ commaSeparatedUsers }}, and {{ lastUser }}', {
        commaSeparatedUsers: slicedArr.join(', '),
        lastUser,
      });
    } else {
      outStr = t('{{ commaSeparatedUsers }} and {{ moreCount }} more', {
        commaSeparatedUsers: slicedArr.join(', '),
        moreCount: restLength,
      });
    }
  }

  return outStr;
};

export const MessagePropTypes = PropTypes.shape({
  created_at: PropTypes.instanceOf(Date).isRequired,
  html: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
}).isRequired;
