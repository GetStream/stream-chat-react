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

var _MessageRepliesCountButton = _interopRequireDefault(
  require('./MessageRepliesCountButton'),
);

var _utils = require('../../utils');

var _context = require('../../context');

var _Attachment = require('../Attachment');

var _Avatar = require('../Avatar');

var _MML = require('../MML');

var _Modal = require('../Modal');

var _MessageInput = require('../MessageInput');

var _Tooltip = require('../Tooltip');

var _Loading = require('../Loading');

var _Reactions = require('../Reactions');

var _MessageOptions = _interopRequireDefault(require('./MessageOptions'));

var _MessageText = _interopRequireDefault(require('./MessageText'));

var _MessageDeleted = _interopRequireDefault(require('./MessageDeleted'));

var _hooks = require('./hooks');

var _utils2 = require('./utils');

var _icons = require('./icons');

var _MessageTimestamp = _interopRequireDefault(require('./MessageTimestamp'));

/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 * @type { React.FC<import('types').MessageSimpleProps> }
 */
var MessageSimple = function MessageSimple(props) {
  var clearEditingState = props.clearEditingState,
    editing = props.editing,
    _props$EditMessageInp = props.EditMessageInput,
    EditMessageInput =
      _props$EditMessageInp === void 0
        ? _MessageInput.EditMessageForm
        : _props$EditMessageInp,
    message = props.message,
    threadList = props.threadList,
    formatDate = props.formatDate,
    propUpdateMessage = props.updateMessage,
    propHandleAction = props.handleAction,
    propHandleOpenThread = props.handleOpenThread,
    propHandleReaction = props.handleReaction,
    propHandleRetry = props.handleRetry,
    onUserClickCustomHandler = props.onUserClick,
    onUserHoverCustomHandler = props.onUserHover,
    propTDateTimeParser = props.tDateTimeParser;

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channelUpdateMessage = _useContext.updateMessage;

  var updateMessage = propUpdateMessage || channelUpdateMessage;

  var _useUserRole = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(message);
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var handleAction = (0, _hooks.useActionHandler)(message);
  var handleRetry = (0, _hooks.useRetryHandler)();

  var _useUserHandler = (0, _hooks.useUserHandler)(message, {
      onUserClickHandler: onUserClickCustomHandler,
      onUserHoverHandler: onUserHoverCustomHandler,
    }),
    onUserClick = _useUserHandler.onUserClick,
    onUserHover = _useUserHandler.onUserHover;

  var reactionSelectorRef = /*#__PURE__*/ _react.default.createRef();

  var messageWrapperRef = (0, _react.useRef)(null);

  var _useReactionClick = (0, _hooks.useReactionClick)(
      message,
      reactionSelectorRef,
    ),
    onReactionListClick = _useReactionClick.onReactionListClick,
    showDetailedReactions = _useReactionClick.showDetailedReactions,
    isReactionEnabled = _useReactionClick.isReactionEnabled;

  var _props$Attachment = props.Attachment,
    Attachment =
      _props$Attachment === void 0 ? _Attachment.Attachment : _props$Attachment,
    _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar,
    _props$MessageDeleted = props.MessageDeleted,
    MessageDeleted =
      _props$MessageDeleted === void 0
        ? _MessageDeleted.default
        : _props$MessageDeleted,
    _props$ReactionSelect = props.ReactionSelector,
    ReactionSelector =
      _props$ReactionSelect === void 0
        ? _Reactions.ReactionSelector
        : _props$ReactionSelect,
    _props$ReactionsList = props.ReactionsList,
    ReactionsList =
      _props$ReactionsList === void 0
        ? _Reactions.ReactionsList
        : _props$ReactionsList;
  var hasReactions = (0, _utils2.messageHasReactions)(message);
  var hasAttachment = (0, _utils2.messageHasAttachments)(message);
  var messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  if (
    (message === null || message === void 0 ? void 0 : message.type) ===
      'message.read' ||
    (message === null || message === void 0 ? void 0 : message.type) ===
      'message.date'
  ) {
    return null;
  }

  if (message !== null && message !== void 0 && message.deleted_at) {
    return (0, _utils.smartRender)(
      MessageDeleted,
      {
        message,
      },
      null,
    );
  }

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    editing &&
      /*#__PURE__*/ _react.default.createElement(
        _Modal.Modal,
        {
          open: editing,
          onClose: clearEditingState,
        },
        /*#__PURE__*/ _react.default.createElement(
          _MessageInput.MessageInput,
          (0, _extends2.default)(
            {
              Input: EditMessageInput,
              message: message,
              clearEditingState: clearEditingState,
              updateMessage: updateMessage,
            },
            props.additionalMessageInputProps,
          ),
        ),
      ),
    message &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          key: message.id || '',
          className: '\n\t\t\t\t\t\t'
            .concat(messageClasses, '\n\t\t\t\t\t\tstr-chat__message--')
            .concat(message.type, '\n\t\t\t\t\t\tstr-chat__message--')
            .concat(message.status, '\n\t\t\t\t\t\t')
            .concat(
              message.text ? 'str-chat__message--has-text' : 'has-no-text',
              '\n\t\t\t\t\t\t',
            )
            .concat(
              hasAttachment ? 'str-chat__message--has-attachment' : '',
              '\n            ',
            )
            .concat(
              hasReactions && isReactionEnabled
                ? 'str-chat__message--with-reactions'
                : '',
              '\n            ',
            )
            .concat(
              message !== null && message !== void 0 && message.pinned
                ? 'pinned-message'
                : '',
              '\n\t\t\t\t\t',
            )
            .trim(),
          ref: messageWrapperRef,
        },
        /*#__PURE__*/ _react.default.createElement(MessageSimpleStatus, props),
        message.user &&
          /*#__PURE__*/ _react.default.createElement(Avatar, {
            image: message.user.image,
            name: message.user.name || message.user.id,
            onClick: onUserClick,
            onMouseOver: onUserHover,
          }),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            'data-testid': 'message-inner',
            className: 'str-chat__message-inner',
            onClick: function onClick() {
              if (
                message.status === 'failed' &&
                (propHandleRetry || handleRetry)
              ) {
                var retryHandler = propHandleRetry || handleRetry; // FIXME: type checking fails here because in the case of a failed message,
                // `message` is of type Client.Message (i.e. request object)
                // instead of Client.MessageResponse (i.e. server response object)
                // @ts-expect-error

                retryHandler(message);
              }
            },
          },
          !message.text &&
            /*#__PURE__*/ _react.default.createElement(
              _react.default.Fragment,
              null,
              /*#__PURE__*/ _react.default.createElement(
                _MessageOptions.default,
                (0, _extends2.default)({}, props, {
                  messageWrapperRef: messageWrapperRef,
                  onReactionListClick: onReactionListClick,
                  handleOpenThread: propHandleOpenThread,
                }),
              ),
              hasReactions &&
                !showDetailedReactions &&
                isReactionEnabled &&
                /*#__PURE__*/ _react.default.createElement(ReactionsList, {
                  reactions: message.latest_reactions,
                  reaction_counts: message.reaction_counts || undefined,
                  own_reactions: message.own_reactions,
                  onClick: onReactionListClick,
                  reverse: true,
                }),
              showDetailedReactions &&
                isReactionEnabled &&
                /*#__PURE__*/ _react.default.createElement(ReactionSelector, {
                  handleReaction: propHandleReaction || handleReaction,
                  detailedView: true,
                  reaction_counts: message.reaction_counts || undefined,
                  latest_reactions: message.latest_reactions,
                  own_reactions: message.own_reactions,
                  ref: reactionSelectorRef,
                }),
            ),
          (message === null || message === void 0
            ? void 0
            : message.attachments) &&
            Attachment &&
            /*#__PURE__*/ _react.default.createElement(Attachment, {
              attachments: message.attachments,
              actionHandler: propHandleAction || handleAction,
            }),
          message.text &&
            /*#__PURE__*/ _react.default.createElement(
              _MessageText.default,
              (0, _extends2.default)({}, props, {
                customOptionProps: {
                  messageWrapperRef,
                  handleOpenThread: propHandleOpenThread,
                }, // FIXME: There's some unmatched definition between the infered and the declared
                // ReactionSelector reference
                // @ts-expect-error
                reactionSelectorRef: reactionSelectorRef,
              }),
            ),
          message.mml &&
            /*#__PURE__*/ _react.default.createElement(_MML.MML, {
              source: message.mml,
              actionHandler: handleAction,
              align: isMyMessage ? 'right' : 'left',
            }),
          !threadList &&
            message.reply_count !== 0 &&
            /*#__PURE__*/ _react.default.createElement(
              'div',
              {
                className: 'str-chat__message-simple-reply-button',
              },
              /*#__PURE__*/ _react.default.createElement(
                _MessageRepliesCountButton.default,
                {
                  onClick: propHandleOpenThread || handleOpenThread,
                  reply_count: message.reply_count,
                },
              ),
            ),
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__message-data str-chat__message-simple-data',
            },
            !isMyMessage && message.user
              ? /*#__PURE__*/ _react.default.createElement(
                  'span',
                  {
                    className: 'str-chat__message-simple-name',
                  },
                  message.user.name || message.user.id,
                )
              : null,
            /*#__PURE__*/ _react.default.createElement(
              _MessageTimestamp.default,
              {
                customClass: 'str-chat__message-simple-timestamp',
                tDateTimeParser: propTDateTimeParser,
                formatDate: formatDate,
                message: message,
                calendar: true,
              },
            ),
          ),
        ),
      ),
  );
};
/** @type { React.FC<import('types').MessageSimpleProps> } */

var MessageSimpleStatus = function MessageSimpleStatus(_ref) {
  var _client$user;

  var _ref$Avatar = _ref.Avatar,
    Avatar = _ref$Avatar === void 0 ? _Avatar.Avatar : _ref$Avatar,
    readBy = _ref.readBy,
    message = _ref.message,
    threadList = _ref.threadList,
    lastReceivedId = _ref.lastReceivedId;

  var _useContext2 = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext2.t;

  var _useContext3 = (0, _react.useContext)(_context.ChannelContext),
    client = _useContext3.client;

  var _useUserRole2 = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole2.isMyMessage;

  if (
    !isMyMessage ||
    (message === null || message === void 0 ? void 0 : message.type) === 'error'
  ) {
    return null;
  }

  var justReadByMe =
    readBy &&
    readBy.length === 1 &&
    readBy[0] &&
    client &&
    readBy[0].id ===
      ((_client$user = client.user) === null || _client$user === void 0
        ? void 0
        : _client$user.id);

  if (message && message.status === 'sending') {
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__message-simple-status',
        'data-testid': 'message-status-sending',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        t && t('Sending...'),
      ),
      /*#__PURE__*/ _react.default.createElement(
        _Loading.LoadingIndicator,
        null,
      ),
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    var lastReadUser = readBy.filter(
      /** @type {(item: import('stream-chat').UserResponse) => boolean} Typescript syntax */
      function (item) {
        var _client$user2;

        return (
          !!item &&
          !!client &&
          item.id !==
            ((_client$user2 = client.user) === null || _client$user2 === void 0
              ? void 0
              : _client$user2.id)
        );
      },
    )[0];
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__message-simple-status',
        'data-testid': 'message-status-read-by',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        readBy && (0, _utils2.getReadByTooltipText)(readBy, t, client),
      ),
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        name:
          lastReadUser === null || lastReadUser === void 0
            ? void 0
            : lastReadUser.name,
        image:
          lastReadUser === null || lastReadUser === void 0
            ? void 0
            : lastReadUser.image,
        size: 15,
      }),
      readBy.length > 2 &&
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            className: 'str-chat__message-simple-status-number',
            'data-testid': 'message-status-read-by-many',
          },
          readBy.length - 1,
        ),
    );
  }

  if (
    message &&
    message.status === 'received' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__message-simple-status',
        'data-testid': 'message-status-received',
      },
      /*#__PURE__*/ _react.default.createElement(
        _Tooltip.Tooltip,
        null,
        t && t('Delivered'),
      ),
      /*#__PURE__*/ _react.default.createElement(
        _icons.DeliveredCheckIcon,
        null,
      ),
    );
  }

  return null;
};

MessageSimple.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
    /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
    _propTypes.default.object.isRequired,

  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment:
    /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /**
   * Custom UI component to override default edit message input
   *
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.js)
   * */
  EditMessageInput:
    /** @type {PropTypes.Validator<React.FC<import("types").MessageInputProps>>} */
    _propTypes.default.elementType,

  /**
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   * */
  Message:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */
    _propTypes.default.oneOfType([
      _propTypes.default.node,
      _propTypes.default.func,
      _propTypes.default.object,
    ]),

  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: _propTypes.default.bool,

  /** Client object */
  // @ts-expect-error
  client: _propTypes.default.object,

  /** If its parent message in thread. */
  initialMessage: _propTypes.default.bool,

  /** Channel config object */
  channelConfig:
    /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
    _propTypes.default.object,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: _propTypes.default.func,

  /** If component is in thread list */
  threadList: _propTypes.default.bool,

  /**
   * Function to open thread on current message
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: _propTypes.default.func,

  /** If the message is in edit state */
  editing: _propTypes.default.bool,

  /** Function to exit edit state */
  clearEditingState: _propTypes.default.func,

  /** Returns true if message belongs to current user */
  isMyMessage: _propTypes.default.func,

  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: _propTypes.default.func.isRequired,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: _propTypes.default.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   * @deprecated This component now relies on the useRetryHandler custom hook.
   */
  handleRetry: _propTypes.default.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
   */
  handleReaction: _propTypes.default.func,

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

  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: _propTypes.default.bool,

  /** DOMRect object for parent MessageList component */
  messageListRect: _propTypes.default.shape({
    x: _propTypes.default.number.isRequired,
    y: _propTypes.default.number.isRequired,
    height: _propTypes.default.number.isRequired,
    width: _propTypes.default.number.isRequired,
    top: _propTypes.default.number.isRequired,
    right: _propTypes.default.number.isRequired,
    bottom: _propTypes.default.number.isRequired,
    left: _propTypes.default.number.isRequired,
    toJSON: _propTypes.default.func.isRequired,
  }),

  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
   */
  handleAction: _propTypes.default.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsHoverMessage: _propTypes.default.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsClickMessage: _propTypes.default.func,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: _propTypes.default.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: _propTypes.default.func,

  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: _propTypes.default.object,

  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(
  MessageSimple,
  _utils2.areMessagePropsEqual,
);

exports.default = _default;
