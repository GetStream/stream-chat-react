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

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _MessageRepliesCountButton = _interopRequireDefault(
  require('./MessageRepliesCountButton'),
);

var _utils = require('../../utils');

var _context = require('../../context');

var _Avatar = require('../Avatar');

var _Attachment = require('../Attachment');

var _MessageInput = require('../MessageInput');

var _Reactions = require('../Reactions');

var _hooks = require('./hooks');

var _utils2 = require('./utils');

var _MessageActions = require('../MessageActions');

var _icons = require('./icons');

var _MessageTimestamp = _interopRequireDefault(require('./MessageTimestamp'));

/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ../../docs/MessageLivestream.md
 * @typedef { import('../../../types').MessageLivestreamProps } Props
 * @type { React.FC<Props> }
 */
var MessageLivestreamComponent = function MessageLivestreamComponent(props) {
  var _message$i18n,
    _message$user4,
    _message$user5,
    _message$user6,
    _message$user7,
    _message$user8;

  var message = props.message,
    groupStyles = props.groupStyles,
    propEditing = props.editing,
    propSetEdit = props.setEditingState,
    propClearEdit = props.clearEditingState,
    initialMessage = props.initialMessage,
    unsafeHTML = props.unsafeHTML,
    formatDate = props.formatDate,
    propChannelConfig = props.channelConfig,
    _props$ReactionsList = props.ReactionsList,
    ReactionsList =
      _props$ReactionsList === void 0
        ? _Reactions.SimpleReactionsList
        : _props$ReactionsList,
    _props$ReactionSelect = props.ReactionSelector,
    ReactionSelector =
      _props$ReactionSelect === void 0
        ? _Reactions.ReactionSelector
        : _props$ReactionSelect,
    propOnUserClick = props.onUserClick,
    propHandleReaction = props.handleReaction,
    propHandleOpenThread = props.handleOpenThread,
    propOnUserHover = props.onUserHover,
    propHandleRetry = props.handleRetry,
    propHandleAction = props.handleAction,
    propUpdateMessage = props.updateMessage,
    propOnMentionsClick = props.onMentionsClickMessage,
    propOnMentionsHover = props.onMentionsHoverMessage,
    _props$Attachment = props.Attachment,
    Attachment =
      _props$Attachment === void 0 ? _Attachment.Attachment : _props$Attachment,
    _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar,
    _props$EditMessageInp = props.EditMessageInput,
    EditMessageInput =
      _props$EditMessageInp === void 0
        ? _MessageInput.EditMessageForm
        : _props$EditMessageInp,
    propT = props.t,
    propTDateTimeParser = props.tDateTimeParser,
    MessageDeleted = props.MessageDeleted,
    _props$PinIndicator = props.PinIndicator,
    PinIndicator =
      _props$PinIndicator === void 0
        ? _icons.PinIndicator
        : _props$PinIndicator;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    contextT = _useContext.t,
    userLanguage = _useContext.userLanguage;

  var t = propT || contextT;
  var messageWrapperRef = (0, _react.useRef)(null);
  var reactionSelectorRef = (0, _react.useRef)(null);
  /**
   *@type {import('types').ChannelContextValue}
   */

  var _useContext2 = (0, _react.useContext)(_context.ChannelContext),
    channelUpdateMessage = _useContext2.updateMessage,
    channel = _useContext2.channel;

  var channelConfig =
    propChannelConfig ||
    (channel === null || channel === void 0 ? void 0 : channel.getConfig());

  var _useMentionsUIHandler = (0, _hooks.useMentionsUIHandler)(message, {
      onMentionsClick: propOnMentionsClick,
      onMentionsHover: propOnMentionsHover,
    }),
    onMentionsClick = _useMentionsUIHandler.onMentionsClick,
    onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var handleAction = (0, _hooks.useActionHandler)(message);
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(message);

  var _useEditHandler = (0, _hooks.useEditHandler)(),
    ownEditing = _useEditHandler.editing,
    ownSetEditing = _useEditHandler.setEdit,
    ownClearEditing = _useEditHandler.clearEdit;

  var editing = propEditing || ownEditing;
  var setEdit = propSetEdit || ownSetEditing;
  var clearEdit = propClearEdit || ownClearEditing;
  var handleRetry = (0, _hooks.useRetryHandler)();
  var retryHandler = propHandleRetry || handleRetry;

  var _useReactionClick = (0, _hooks.useReactionClick)(
      message,
      reactionSelectorRef,
      messageWrapperRef,
    ),
    onReactionListClick = _useReactionClick.onReactionListClick,
    showDetailedReactions = _useReactionClick.showDetailedReactions,
    isReactionEnabled = _useReactionClick.isReactionEnabled;

  var _useUserHandler = (0, _hooks.useUserHandler)(message, {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    }),
    onUserClick = _useUserHandler.onUserClick,
    onUserHover = _useUserHandler.onUserHover;

  var messageTextToRender =
    (message === null || message === void 0
      ? void 0
      : (_message$i18n = message.i18n) === null || _message$i18n === void 0
      ? void 0
      : _message$i18n[''.concat(userLanguage, '_text')]) ||
    (message === null || message === void 0 ? void 0 : message.text);
  var messageMentionedUsersItem =
    message === null || message === void 0 ? void 0 : message.mentioned_users;
  var messageText = (0, _react.useMemo)(
    function () {
      return (0, _utils.renderText)(
        messageTextToRender,
        messageMentionedUsersItem,
      );
    },
    [messageMentionedUsersItem, messageTextToRender],
  );
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (
    !message ||
    message.type === 'message.read' ||
    message.type === 'message.date'
  ) {
    return null;
  }

  if (message.deleted_at) {
    return (0, _utils.smartRender)(MessageDeleted, props, null);
  }

  if (editing) {
    var _message$user, _message$user2, _message$user3;

    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-livestream-edit',
        className: 'str-chat__message-team str-chat__message-team--'.concat(
          firstGroupStyle,
          ' str-chat__message-team--editing',
        ),
      },
      (firstGroupStyle === 'top' || firstGroupStyle === 'single') &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__message-team-meta',
          },
          /*#__PURE__*/ _react.default.createElement(Avatar, {
            image:
              (_message$user = message.user) === null ||
              _message$user === void 0
                ? void 0
                : _message$user.image,
            name:
              ((_message$user2 = message.user) === null ||
              _message$user2 === void 0
                ? void 0
                : _message$user2.name) ||
              ((_message$user3 = message.user) === null ||
              _message$user3 === void 0
                ? void 0
                : _message$user3.id),
            size: 40,
            onClick: onUserClick,
            onMouseOver: onUserHover,
          }),
        ),
      /*#__PURE__*/ _react.default.createElement(_MessageInput.MessageInput, {
        Input: EditMessageInput,
        message: message,
        clearEditingState: clearEdit,
        updateMessage: propUpdateMessage || channelUpdateMessage,
      }),
    );
  }

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    (message === null || message === void 0 ? void 0 : message.pinned) &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-livestream-pin-indicator',
        },
        /*#__PURE__*/ _react.default.createElement(PinIndicator, {
          message: message,
          t: t,
        }),
      ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-livestream',
        className: 'str-chat__message-livestream str-chat__message-livestream--'
          .concat(firstGroupStyle, ' str-chat__message-livestream--')
          .concat(message.type, ' str-chat__message-livestream--')
          .concat(message.status, ' ')
          .concat(
            initialMessage
              ? 'str-chat__message-livestream--initial-message'
              : '',
            ' ',
          )
          .concat(
            message !== null && message !== void 0 && message.pinned
              ? 'pinned-message'
              : '',
          ),
        ref: messageWrapperRef,
      },
      showDetailedReactions &&
        isReactionEnabled &&
        /*#__PURE__*/ _react.default.createElement(ReactionSelector, {
          reverse: false,
          handleReaction: handleReaction,
          detailedView: true,
          latest_reactions:
            message === null || message === void 0
              ? void 0
              : message.latest_reactions,
          reaction_counts:
            (message === null || message === void 0
              ? void 0
              : message.reaction_counts) || undefined,
          own_reactions: message.own_reactions,
          ref: reactionSelectorRef,
        }),
      /*#__PURE__*/ _react.default.createElement(MessageLivestreamActions, {
        initialMessage: initialMessage,
        message: message,
        formatDate: formatDate,
        onReactionListClick: onReactionListClick,
        messageWrapperRef: messageWrapperRef,
        getMessageActions: props.getMessageActions,
        tDateTimeParser: propTDateTimeParser,
        channelConfig: channelConfig,
        threadList: props.threadList,
        addNotification: props.addNotification,
        handleOpenThread: propHandleOpenThread || handleOpenThread,
        setEditingState: setEdit,
      }),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-livestream-left',
        },
        /*#__PURE__*/ _react.default.createElement(Avatar, {
          image:
            (_message$user4 = message.user) === null ||
            _message$user4 === void 0
              ? void 0
              : _message$user4.image,
          name:
            ((_message$user5 = message.user) === null ||
            _message$user5 === void 0
              ? void 0
              : _message$user5.name) ||
            (message === null || message === void 0
              ? void 0
              : (_message$user6 = message.user) === null ||
                _message$user6 === void 0
              ? void 0
              : _message$user6.id),
          size: 30,
          onClick: onUserClick,
          onMouseOver: onUserHover,
        }),
      ),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-livestream-right',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__message-livestream-content',
          },
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__message-livestream-author',
            },
            /*#__PURE__*/ _react.default.createElement(
              'strong',
              null,
              ((_message$user7 = message.user) === null ||
              _message$user7 === void 0
                ? void 0
                : _message$user7.name) ||
                ((_message$user8 = message.user) === null ||
                _message$user8 === void 0
                  ? void 0
                  : _message$user8.id),
            ),
            (message === null || message === void 0 ? void 0 : message.type) ===
              'error' &&
              /*#__PURE__*/ _react.default.createElement(
                'div',
                {
                  className: 'str-chat__message-team-error-header',
                },
                t('Only visible to you'),
              ),
          ),
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              'data-testid': 'message-livestream-text',
              className: (0, _utils.isOnlyEmojis)(message.text)
                ? 'str-chat__message-livestream-text--is-emoji'
                : '',
              onMouseOver: onMentionsHover,
              onClick: onMentionsClick,
            },
            message.type !== 'error' &&
              message.status !== 'failed' &&
              !unsafeHTML &&
              messageText,
            message.type !== 'error' &&
              message.status !== 'failed' &&
              unsafeHTML &&
              !!message.html &&
              /*#__PURE__*/ _react.default.createElement('div', {
                dangerouslySetInnerHTML: {
                  __html: message.html,
                },
              }),
            message.type === 'error' &&
              !message.command &&
              /*#__PURE__*/ _react.default.createElement(
                'p',
                {
                  'data-testid': 'message-livestream-error',
                },
                /*#__PURE__*/ _react.default.createElement(
                  _icons.ErrorIcon,
                  null,
                ),
                message.text,
              ),
            message.type === 'error' &&
              message.command &&
              /*#__PURE__*/ _react.default.createElement(
                'p',
                {
                  'data-testid': 'message-livestream-command-error',
                },
                /*#__PURE__*/ _react.default.createElement(
                  _icons.ErrorIcon,
                  null,
                ),
                /*#__PURE__*/ _react.default.createElement(
                  'strong',
                  null,
                  '/',
                  message.command,
                ),
                ' is not a valid command',
              ),
            message.status === 'failed' &&
              /*#__PURE__*/ _react.default.createElement(
                'p',
                {
                  onClick: function onClick() {
                    if (retryHandler) {
                      // FIXME: type checking fails here because in the case of a failed message,
                      // `message` is of type Client.Message (i.e. request object)
                      // instead of Client.MessageResponse (i.e. server response object)
                      // @ts-expect-error
                      retryHandler(message);
                    }
                  },
                },
                /*#__PURE__*/ _react.default.createElement(
                  _icons.ErrorIcon,
                  null,
                ),
                t('Message failed. Click to try again.'),
              ),
          ),
          (message === null || message === void 0
            ? void 0
            : message.attachments) &&
            Attachment &&
            /*#__PURE__*/ _react.default.createElement(Attachment, {
              attachments: message.attachments,
              actionHandler: propHandleAction || handleAction,
            }),
          isReactionEnabled &&
            /*#__PURE__*/ _react.default.createElement(ReactionsList, {
              reaction_counts: message.reaction_counts || undefined,
              reactions: message.latest_reactions,
              own_reactions: message.own_reactions,
              handleReaction: propHandleReaction || handleReaction,
            }),
          !initialMessage &&
            /*#__PURE__*/ _react.default.createElement(
              _MessageRepliesCountButton.default,
              {
                onClick: propHandleOpenThread || handleOpenThread,
                reply_count: message.reply_count,
              },
            ),
        ),
      ),
    ),
  );
};
/**
 * @type { React.FC<import('types').MessageLivestreamActionProps> }
 */

var MessageLivestreamActions = function MessageLivestreamActions(props) {
  var initialMessage = props.initialMessage,
    message = props.message,
    channelConfig = props.channelConfig,
    threadList = props.threadList,
    formatDate = props.formatDate,
    messageWrapperRef = props.messageWrapperRef,
    onReactionListClick = props.onReactionListClick,
    getMessageActions = props.getMessageActions,
    handleOpenThread = props.handleOpenThread,
    propTDateTimeParser = props.tDateTimeParser;

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    actionsBoxOpen = _useState2[0],
    setActionsBoxOpen = _useState2[1];
  /** @type {() => void} Typescript syntax */

  var hideOptions = (0, _react.useCallback)(function () {
    return setActionsBoxOpen(false);
  }, []);
  var messageDeletedAt = !!(
    message !== null &&
    message !== void 0 &&
    message.deleted_at
  );
  var messageWrapper =
    messageWrapperRef === null || messageWrapperRef === void 0
      ? void 0
      : messageWrapperRef.current;
  (0, _react.useEffect)(
    function () {
      if (messageWrapper) {
        messageWrapper.addEventListener('mouseleave', hideOptions);
      }

      return function () {
        if (messageWrapper) {
          messageWrapper.removeEventListener('mouseleave', hideOptions);
        }
      };
    },
    [messageWrapper, hideOptions],
  );
  (0, _react.useEffect)(
    function () {
      if (messageDeletedAt) {
        document.removeEventListener('click', hideOptions);
      }
    },
    [messageDeletedAt, hideOptions],
  );
  (0, _react.useEffect)(
    function () {
      if (actionsBoxOpen) {
        document.addEventListener('click', hideOptions);
      } else {
        document.removeEventListener('click', hideOptions);
      }

      return function () {
        document.removeEventListener('click', hideOptions);
      };
    },
    [actionsBoxOpen, hideOptions],
  );

  if (
    initialMessage ||
    !message ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending'
  ) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      'data-testid': 'message-livestream-actions',
      className: 'str-chat__message-livestream-actions',
    },
    /*#__PURE__*/ _react.default.createElement(_MessageTimestamp.default, {
      customClass: 'str-chat__message-livestream-time',
      message: message,
      formatDate: formatDate,
      tDateTimeParser: propTDateTimeParser,
    }),
    channelConfig &&
      channelConfig.reactions &&
      /*#__PURE__*/ _react.default.createElement(
        'span',
        {
          onClick: onReactionListClick,
          'data-testid': 'message-livestream-reactions-action',
        },
        /*#__PURE__*/ _react.default.createElement(
          'span',
          null,
          /*#__PURE__*/ _react.default.createElement(_icons.ReactionIcon, null),
        ),
      ),
    !threadList &&
      channelConfig &&
      channelConfig.replies &&
      /*#__PURE__*/ _react.default.createElement(
        'span',
        {
          'data-testid': 'message-livestream-thread-action',
          onClick: handleOpenThread,
        },
        /*#__PURE__*/ _react.default.createElement(_icons.ThreadIcon, null),
      ),
    /*#__PURE__*/ _react.default.createElement(
      _MessageActions.MessageActions,
      (0, _extends2.default)({}, props, {
        getMessageActions: getMessageActions,
        customWrapperClass: '',
        inline: true,
      }),
    ),
  );
};

MessageLivestreamComponent.propTypes = {
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
   * Custom UI component to override default pinned message indicator
   *
   * Defaults to and accepts same props as: [PinIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message/icon.js)
   * */
  PinIndicator:
    /** @type {PropTypes.Validator<React.FC<import("types").PinIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   *
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

  /** If its parent message in thread. */
  initialMessage: _propTypes.default.bool,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: _propTypes.default.func,

  /** Channel config object */
  channelConfig:
    /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */
    _propTypes.default.object,

  /** If component is in thread list */
  threadList: _propTypes.default.bool,

  /** Function to open thread on current message */
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
  getMessageActions:
    /** @type {PropTypes.Validator<() => Array<string>>} */
    _propTypes.default.func,

  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: _propTypes.default.func,

  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   */
  handleRetry: _propTypes.default.func,

  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
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

  /** @deprecated This property is no longer used * */
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
   */
  handleAction: _propTypes.default.func,

  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: _propTypes.default.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
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
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(
  MessageLivestreamComponent,
  _utils2.areMessagePropsEqual,
);

exports.default = _default;
