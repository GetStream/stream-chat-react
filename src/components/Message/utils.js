// @ts-check
import deepequal from 'deep-equal';
import PropTypes from 'prop-types';

/**
 * Following function validates a function which returns notification message.
 * It validates if the first parameter is function and also if return value of function is string or no.
 *
 * @type {(func: Function, args: any) => null | string}
 */
export const validateAndGetMessage = (func, args) => {
  if (!func || typeof func !== 'function') return null;

  const returnValue = func(...args);

  if (typeof returnValue !== 'string') return null;

  return returnValue;
};

/**
 * Tell if the owner of the current message is muted
 *
 * @type {(message?: import('stream-chat').MessageResponse, mutes?: import('stream-chat').Mute[]) => boolean}
 */
export const isUserMuted = (message, mutes) => {
  if (!mutes || !message) {
    return false;
  }

  const userMuted = mutes.filter(
    /** @type {(el: import('stream-chat').Mute) => boolean} Typescript syntax */
    (el) => el.target.id === message.user?.id,
  );
  return !!userMuted.length;
};

export const MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  flag: 'flag',
  mute: 'mute',
};

/**
 * @typedef {{
 *   canEdit: boolean;
 *   canDelete: boolean;
 *   canMute: boolean;
 *   canFlag: boolean;
 * }} Capabilities
 * @type {(actions: string[] | boolean, capabilities: Capabilities) => string[]} Typescript syntax
 */
export const getMessageActions = (
  actions,
  { canDelete, canFlag, canEdit, canMute },
) => {
  const messageActionsAfterPermission = [];
  let messageActions = [];

  if (actions && typeof actions === 'boolean') {
    // If value of actions is true, then populate all the possible values
    messageActions = Object.keys(MESSAGE_ACTIONS);
  } else if (actions && actions.length > 0) {
    messageActions = [...actions];
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

  return messageActionsAfterPermission;
};

/**
 * @type {(nextProps: import('types').MessageComponentProps, props: import('types').MessageComponentProps ) => boolean} Typescript syntax
 */
export const areMessagePropsEqual = (props, nextProps) => {
  return (
    // Message content is equal
    nextProps.message === props.message &&
    // Message was read by someone
    deepequal(nextProps.readBy, props.readBy) &&
    // Group style changes (it often happens that the last 3 messages of a channel have different group styles)
    deepequal(nextProps.groupStyles, props.groupStyles) &&
    // Last message received in the channel changes
    deepequal(nextProps.lastReceivedId, props.lastReceivedId) &&
    // User toggles edit state
    nextProps.editing === props.editing &&
    // Message wrapper layout changes
    nextProps.messageListRect === props.messageListRect
  );
};

/**
 * @type {(nextProps: import('types').MessageComponentProps, props: import('types').MessageComponentProps ) => boolean} Typescript syntax
 */
export const shouldMessageComponentUpdate = (props, nextProps) => {
  // Component should only update if:
  return !areMessagePropsEqual(props, nextProps);
};

export const MessagePropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
}).isRequired;
