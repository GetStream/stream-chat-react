'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _MessageSimple = _interopRequireDefault(require('./MessageSimple'));

var _hooks = require('./hooks');

var _utils = require('./utils');

var _context = require('../../context');

var _utils2 = require('../../utils');

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../../docs/Message.md
 * @type { React.FC<import('types').MessageComponentProps> }
 */
var Message = function Message(props) {
  var addNotification = props.addNotification,
    propChannel = props.channel,
    formatDate = props.formatDate,
    getFlagMessageErrorNotification = props.getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification = props.getFlagMessageSuccessNotification,
    getMuteUserErrorNotification = props.getMuteUserErrorNotification,
    getMuteUserSuccessNotification = props.getMuteUserSuccessNotification,
    getPinMessageErrorNotification = props.getPinMessageErrorNotification,
    _props$groupStyles = props.groupStyles,
    groupStyles = _props$groupStyles === void 0 ? [] : _props$groupStyles,
    _props$Message = props.Message,
    MessageUIComponent =
      _props$Message === void 0 ? _MessageSimple.default : _props$Message,
    message = props.message,
    _props$messageActions = props.messageActions,
    messageActions =
      _props$messageActions === void 0
        ? Object.keys(_utils.MESSAGE_ACTIONS)
        : _props$messageActions,
    propOnMentionsClick = props.onMentionsClick,
    propOnMentionsHover = props.onMentionsHover,
    propOnUserClick = props.onUserClick,
    propOnUserHover = props.onUserHover,
    propOpenThread = props.openThread,
    _props$pinPermissions = props.pinPermissions,
    pinPermissions =
      _props$pinPermissions === void 0
        ? _utils.defaultPinPermissions
        : _props$pinPermissions,
    propRetrySendMessage = props.retrySendMessage;

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    contextChannel = _useContext.channel;

  var channel = propChannel || contextChannel;
  var channelConfig =
    (channel === null || channel === void 0 ? void 0 : channel.getConfig) &&
    channel.getConfig();
  var handleAction = (0, _hooks.useActionHandler)(message);
  var handleDelete = (0, _hooks.useDeleteHandler)(message);

  var _useEditHandler = (0, _hooks.useEditHandler)(),
    editing = _useEditHandler.editing,
    setEdit = _useEditHandler.setEdit,
    clearEdit = _useEditHandler.clearEdit;

  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(
    message,
    propOpenThread,
  );
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var handleRetry = (0, _hooks.useRetryHandler)(propRetrySendMessage);
  var handleFlag = (0, _hooks.useFlagHandler)(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    getErrorNotification: getFlagMessageErrorNotification,
  });
  var handleMute = (0, _hooks.useMuteHandler)(message, {
    notify: addNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    getErrorNotification: getMuteUserErrorNotification,
  });

  var _useMentionsHandler = (0, _hooks.useMentionsHandler)(message, {
      onMentionsClick: propOnMentionsClick,
      onMentionsHover: propOnMentionsHover,
    }),
    onMentionsClick = _useMentionsHandler.onMentionsClick,
    onMentionsHover = _useMentionsHandler.onMentionsHover;

  var _usePinHandler = (0, _hooks.usePinHandler)(message, pinPermissions, {
      notify: addNotification,
      getErrorNotification: getPinMessageErrorNotification,
    }),
    canPin = _usePinHandler.canPin,
    handlePin = _usePinHandler.handlePin;

  var _useUserHandler = (0, _hooks.useUserHandler)(message, {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    }),
    onUserClick = _useUserHandler.onUserClick,
    onUserHover = _useUserHandler.onUserHover;

  var _useUserRole = (0, _hooks.useUserRole)(message),
    _isMyMessage = _useUserRole.isMyMessage,
    isAdmin = _useUserRole.isAdmin,
    isModerator = _useUserRole.isModerator,
    isOwner = _useUserRole.isOwner;

  var canEdit = _isMyMessage || isModerator || isOwner || isAdmin;
  var canDelete = canEdit;
  var canReact = true;
  var canReply = true;
  var messageActionsHandler = (0, _react.useCallback)(
    function () {
      if (!message || !messageActions) {
        return [];
      }

      return (0, _utils.getMessageActions)(messageActions, {
        canDelete,
        canEdit,
        canPin,
        canReply,
        canReact,
        canFlag: !_isMyMessage,
        canMute:
          !_isMyMessage &&
          !!(
            channelConfig !== null &&
            channelConfig !== void 0 &&
            channelConfig.mutes
          ),
      });
    },
    [
      canDelete,
      canEdit,
      canPin,
      canReply,
      canReact,
      channelConfig === null || channelConfig === void 0
        ? void 0
        : channelConfig.mutes,
      _isMyMessage,
      message,
      messageActions,
    ],
  );
  var actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';
  return (
    MessageUIComponent &&
    /*#__PURE__*/ _react.default.createElement(
      MessageUIComponent,
      (0, _extends2.default)({}, props, {
        actionsEnabled: actionsEnabled,
        channelConfig: channelConfig,
        clearEditingState: clearEdit,
        editing: editing,
        formatDate: formatDate,
        getMessageActions: messageActionsHandler,
        groupStyles: groupStyles,
        handleAction: handleAction,
        handleDelete: handleDelete,
        handleEdit: setEdit,
        handleFlag: handleFlag,
        handleMute: handleMute,
        handlePin: handlePin,
        handleReaction: handleReaction,
        handleRetry: handleRetry,
        handleOpenThread: handleOpenThread,
        isMyMessage: function isMyMessage() {
          return _isMyMessage;
        },
        Message: MessageUIComponent,
        onMentionsClickMessage: onMentionsClick,
        onMentionsHoverMessage: onMentionsHover,
        onUserClick: onUserClick,
        onUserHover: onUserHover,
        setEditingState: setEdit,
      }),
    )
  );
};

Message.propTypes = {
  /** The message object */
  message:
    /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
    _propTypes.default.shape({
      text: _propTypes.default.string.isRequired,
      html: _propTypes.default.string.isRequired,
      type: _propTypes.default.string.isRequired,
      reaction_counts: _propTypes.default.objectOf(
        _propTypes.default.number.isRequired,
      ),
      reaction_scores: _propTypes.default.objectOf(
        _propTypes.default.number.isRequired,
      ),
      created_at: _propTypes.default.oneOfType([
        _propTypes.default.string,
        _propTypes.default.object,
      ]),
      updated_at: _propTypes.default.oneOfType([
        _propTypes.default.string,
        _propTypes.default.object,
      ]),
    }).isRequired,

  /** The client connection object for connecting to Stream */
  client:
    /** @type {PropTypes.Validator<import('types').StreamChatReactClient>} */
    _propTypes.default.objectOf(_utils2.checkClientPropType),

  /** The current channel this message is displayed in */
  channel:
    /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatReactClient['channel']>>} */
    _propTypes.default.objectOf(_utils2.checkChannelPropType),

  /** A list of users that have read this message */
  readBy: _propTypes.default.array,

  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: _propTypes.default.array,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: _propTypes.default.func,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /**
   * Message UI component to display a message in message list.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Message:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */
    _propTypes.default.elementType,

  /**
   * The component that will be rendered if the message has been deleted.
   * All props are passed into this component.
   */
  MessageDeleted:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */
    _propTypes.default.elementType,

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */
    _propTypes.default.elementType,

  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */
    _propTypes.default.elementType,

  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Attachment:
    /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */
    _propTypes.default.elementType,

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: _propTypes.default.bool,

  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: _propTypes.default.oneOfType([
    _propTypes.default.bool,
    _propTypes.default.array,
  ]),

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageSuccessNotification: _propTypes.default.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageErrorNotification: _propTypes.default.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserSuccessNotification: _propTypes.default.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserErrorNotification: _propTypes.default.func,

  /**
   * Function that returns message/text as string to be shown as notification, when request for pinning a message runs into error
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format)
   *
   * */
  getPinMessageErrorNotification: _propTypes.default.func,

  /** Latest message id on current channel */
  lastReceivedId: _propTypes.default.string,

  /** DOMRect object for parent MessageList component */
  messageListRect:
    /** @type {PropTypes.Validator<DOMRect>} */
    _propTypes.default.object,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  members:
    /** @type {PropTypes.Validator<{[user_id: string]: import('stream-chat').ChannelMemberResponse<import('types').StreamChatReactUserType>} | null | undefined>} */
    _propTypes.default.object,

  /**
   * Function to add custom notification on message list
   *
   * @param text Notification text to display
   * @param type Type of notification. 'success' | 'error'
   * */
  addNotification: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  updateMessage: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  removeMessage: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  retrySendMessage: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsClick: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  onMentionsHover: _propTypes.default.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   * @param user the User object for the corresponding user.
   */
  onUserClick: _propTypes.default.func,

  /**
   * The handler for hover events on the user that posted the message
   *
   * @param event Dom hover event which triggered handler.
   * @param user the User object for the corresponding user.
   */
  onUserHover: _propTypes.default.func,

  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  openThread: _propTypes.default.func,

  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: _propTypes.default.object,

  /**
   * The user roles allowed to pin messages in various channel types
   */
  pinPermissions:
    /** @type {PropTypes.Validator<import('types').PinPermissions>>} */
    _propTypes.default.object,
};
Message.defaultProps = {
  readBy: [],
};

var _default = /*#__PURE__*/ _react.default.memo(
  Message,
  _utils.areMessagePropsEqual,
);

exports.default = _default;
