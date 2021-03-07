'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.MessagePropTypes = exports.getReadByTooltipText = exports.getNonImageAttachments = exports.getImages = exports.messageHasAttachments = exports.messageHasReactions = exports.shouldMessageComponentUpdate = exports.areMessagePropsEqual = exports.getMessageActions = exports.defaultPinPermissions = exports.MESSAGE_ACTIONS = exports.isUserMuted = exports.validateAndGetMessage = void 0;

var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray'),
);

var _reactFastCompare = _interopRequireDefault(require('react-fast-compare'));

var _propTypes = _interopRequireDefault(require('prop-types'));

// @ts-check

/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 * @type {(func: Function, args: any) => null | string}
 */
var validateAndGetMessage = function validateAndGetMessage(func, args) {
  if (!func || typeof func !== 'function') return null;
  var returnValue = func.apply(void 0, (0, _toConsumableArray2.default)(args));
  if (typeof returnValue !== 'string') return null;
  return returnValue;
};
/**
 * Tell if the owner of the current message is muted
 *
 * @type {(message?: import('stream-chat').MessageResponse, mutes?: import('stream-chat').Mute[]) => boolean}
 */

exports.validateAndGetMessage = validateAndGetMessage;

var isUserMuted = function isUserMuted(message, mutes) {
  if (!mutes || !message) {
    return false;
  }

  var userMuted = mutes.filter(
    /** @type {(el: import('stream-chat').Mute) => boolean} Typescript syntax */
    function (el) {
      var _message$user;

      return (
        el.target.id ===
        ((_message$user = message.user) === null || _message$user === void 0
          ? void 0
          : _message$user.id)
      );
    },
  );
  return !!userMuted.length;
};

exports.isUserMuted = isUserMuted;
var MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  flag: 'flag',
  mute: 'mute',
  pin: 'pin',
  react: 'react',
  reply: 'reply',
};
exports.MESSAGE_ACTIONS = MESSAGE_ACTIONS;
var defaultPinPermissions = {
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
/**
 * @typedef {{
 *   canEdit?: boolean;
 *   canDelete?: boolean;
 *   canMute?: boolean;
 *   canFlag?: boolean;
 *   canPin?: boolean;
 *   canReact?: boolean;
 *   canReply?: boolean;
 * }} Capabilities
 * @type {(actions: string[] | boolean, capabilities: Capabilities) => string[]} Typescript syntax
 */

exports.defaultPinPermissions = defaultPinPermissions;

var getMessageActions = function getMessageActions(actions, _ref) {
  var canDelete = _ref.canDelete,
    canFlag = _ref.canFlag,
    canEdit = _ref.canEdit,
    canMute = _ref.canMute,
    canPin = _ref.canPin,
    canReact = _ref.canReact,
    canReply = _ref.canReply;
  var messageActionsAfterPermission = [];
  var messageActions = [];

  if (actions && typeof actions === 'boolean') {
    // If value of actions is true, then populate all the possible values
    messageActions = Object.keys(MESSAGE_ACTIONS);
  } else if (actions && actions.length > 0) {
    messageActions = (0, _toConsumableArray2.default)(actions);
  } else {
    return [];
  }

  if (canEdit && messageActions.indexOf(MESSAGE_ACTIONS.edit) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.edit);
  }

  if (canDelete && messageActions.indexOf(MESSAGE_ACTIONS.delete) > -1) {
    messageActionsAfterPermission.push(MESSAGE_ACTIONS.delete);
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
};
/**
 * @typedef {Pick<import('types').MessageComponentProps, 'message' | 'readBy' | 'groupStyles' | 'lastReceivedId' | 'messageListRect'>} MessageEqualProps
 * @type {(props: MessageEqualProps, nextProps: MessageEqualProps) => boolean} Typescript syntax
 */

exports.getMessageActions = getMessageActions;

var areMessagePropsEqual = function areMessagePropsEqual(props, nextProps) {
  return (
    // Message content is equal
    nextProps.message === props.message && // Message was read by someone
    (0, _reactFastCompare.default)(nextProps.readBy, props.readBy) && // Group style changes (it often happens that the last 3 messages of a channel have different group styles)
    (0, _reactFastCompare.default)(nextProps.groupStyles, props.groupStyles) && // @ts-expect-error
    (0, _reactFastCompare.default)(nextProps.mutes, props.mutes) && // Last message received in the channel changes
    (0, _reactFastCompare.default)(
      nextProps.lastReceivedId,
      props.lastReceivedId,
    ) && // User toggles edit state
    // @ts-expect-error // TODO: fix
    nextProps.editing === props.editing && // Message wrapper layout changes
    nextProps.messageListRect === props.messageListRect
  );
};
/**
 * @type {(nextProps: import('types').MessageComponentProps, props: import('types').MessageComponentProps ) => boolean} Typescript syntax
 */

exports.areMessagePropsEqual = areMessagePropsEqual;

var shouldMessageComponentUpdate = function shouldMessageComponentUpdate(
  props,
  nextProps,
) {
  // Component should only update if:
  return !areMessagePropsEqual(props, nextProps);
};
/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */

exports.shouldMessageComponentUpdate = shouldMessageComponentUpdate;

var messageHasReactions = function messageHasReactions(message) {
  return (
    !!(message !== null && message !== void 0 && message.latest_reactions) &&
    !!message.latest_reactions.length
  );
};
/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */

exports.messageHasReactions = messageHasReactions;

var messageHasAttachments = function messageHasAttachments(message) {
  return (
    !!(message !== null && message !== void 0 && message.attachments) &&
    !!message.attachments.length
  );
};
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => import('stream-chat').Attachment[] }
 */

exports.messageHasAttachments = messageHasAttachments;

var getImages = function getImages(message) {
  if (!(message !== null && message !== void 0 && message.attachments)) {
    return [];
  }

  return message.attachments.filter(
    /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
    function (item) {
      return item.type === 'image';
    },
  );
};
/**
 * @type {(message: import('stream-chat').MessageResponse | undefined) => import('stream-chat').Attachment[] }
 */

exports.getImages = getImages;

var getNonImageAttachments = function getNonImageAttachments(message) {
  if (!(message !== null && message !== void 0 && message.attachments)) {
    return [];
  }

  return message.attachments.filter(
    /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
    function (item) {
      return item.type !== 'image';
    },
  );
};
/**
 * @typedef {Array<import('stream-chat').UserResponse<import('types').StreamChatReactUserType>>} ReadByUsers
 * @type {(
 *   users: ReadByUsers,
 *   t: import('types').TranslationContextValue['t'],
 *   client: import('types').ChannelContextValue['client']
 * ) => string}
 */

exports.getNonImageAttachments = getNonImageAttachments;

var getReadByTooltipText = function getReadByTooltipText(users, t, client) {
  var outStr = '';

  if (!t) {
    throw new Error(
      '`getReadByTooltipText was called, but translation function is not available`',
    );
  } // first filter out client user, so restLength won't count it

  var otherUsers = users
    .filter(function (item) {
      return (
        item &&
        (client === null || client === void 0 ? void 0 : client.user) &&
        item.id !== client.user.id
      );
    })
    .map(function (item) {
      return item.name || item.id;
    });
  var slicedArr = otherUsers.slice(0, 5);
  var restLength = otherUsers.length - slicedArr.length;

  if (slicedArr.length === 1) {
    outStr = ''.concat(slicedArr[0], ' ');
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
      var lastUser = slicedArr.splice(slicedArr.length - 2, 1);
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

exports.getReadByTooltipText = getReadByTooltipText;

var MessagePropTypes = _propTypes.default.shape({
  id: _propTypes.default.string.isRequired,
  type: _propTypes.default.string.isRequired,
  text: _propTypes.default.string.isRequired,
  html: _propTypes.default.string.isRequired,
  created_at: _propTypes.default.instanceOf(Date).isRequired,
  updated_at: _propTypes.default.instanceOf(Date).isRequired,
}).isRequired;

exports.MessagePropTypes = MessagePropTypes;
