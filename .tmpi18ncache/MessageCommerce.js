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

var _utils = require('../../utils');

var _Attachment = require('../Attachment');

var _Avatar = require('../Avatar');

var _MML = require('../MML');

var _Reactions = require('../Reactions');

var _MessageRepliesCountButton = _interopRequireDefault(
  require('./MessageRepliesCountButton'),
);

var _utils2 = require('./utils');

var _MessageOptions = _interopRequireDefault(require('./MessageOptions'));

var _MessageText = _interopRequireDefault(require('./MessageText'));

var _hooks = require('./hooks');

var _MessageTimestamp = _interopRequireDefault(require('./MessageTimestamp'));

/**
 * MessageCommerce - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageCommerce.md
 * @type { React.FC<import('types').MessageCommerceProps> }
 */
var MessageCommerce = function MessageCommerce(props) {
  var _message$user,
    _message$user2,
    _message$user3,
    _message$user4,
    _message$user5;

  var message = props.message,
    formatDate = props.formatDate,
    groupStyles = props.groupStyles,
    actionsEnabled = props.actionsEnabled,
    threadList = props.threadList,
    MessageDeleted = props.MessageDeleted,
    getMessageActions = props.getMessageActions,
    _props$ReactionsList = props.ReactionsList,
    ReactionsList =
      _props$ReactionsList === void 0
        ? _Reactions.ReactionsList
        : _props$ReactionsList,
    _props$ReactionSelect = props.ReactionSelector,
    ReactionSelector =
      _props$ReactionSelect === void 0
        ? _Reactions.ReactionSelector
        : _props$ReactionSelect,
    propHandleReaction = props.handleReaction,
    propHandleAction = props.handleAction,
    propHandleOpenThread = props.handleOpenThread,
    propOnUserClick = props.onUserClick,
    propOnUserHover = props.onUserHover,
    propTDateTimeParser = props.tDateTimeParser;
  var Attachment = props.Attachment || _Attachment.Attachment;
  var Avatar = props.Avatar || _Avatar.Avatar;
  var hasReactions = (0, _utils2.messageHasReactions)(message);
  var handleAction = (0, _hooks.useActionHandler)(message);
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(message);
  var reactionSelectorRef = (0, _react.useRef)(null);

  var _useReactionClick = (0, _hooks.useReactionClick)(
      message,
      reactionSelectorRef,
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

  var _useUserRole = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  var messageClasses = 'str-chat__message-commerce str-chat__message-commerce--'.concat(
    isMyMessage ? 'right' : 'left',
  );
  var hasAttachment = (0, _utils2.messageHasAttachments)(message);
  var firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (message !== null && message !== void 0 && message.deleted_at) {
    return (0, _utils.smartRender)(MessageDeleted, props, null);
  }

  if (
    message &&
    (message.type === 'message.read' || message.type === 'message.date')
  ) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-commerce-wrapper',
        key:
          (message === null || message === void 0 ? void 0 : message.id) || '',
        className: '\n\t\t\t\t\t\t'
          .concat(messageClasses, '\n\t\t\t\t\t\tstr-chat__message-commerce--')
          .concat(
            message === null || message === void 0 ? void 0 : message.type,
            '\n\t\t\t\t\t\t',
          )
          .concat(
            message !== null && message !== void 0 && message.text
              ? 'str-chat__message-commerce--has-text'
              : 'str-chat__message-commerce--has-no-text',
            '\n\t\t\t\t\t\t',
          )
          .concat(
            hasAttachment ? 'str-chat__message-commerce--has-attachment' : '',
            '\n\t\t\t\t\t\t',
          )
          .concat(
            hasReactions && isReactionEnabled
              ? 'str-chat__message-commerce--with-reactions'
              : '',
            '\n            ',
            'str-chat__message-commerce--'.concat(firstGroupStyle),
            '\n            ',
          )
          .concat(
            message !== null && message !== void 0 && message.pinned
              ? 'pinned-message'
              : '',
            '\n\t\t\t\t\t',
          )
          .trim(),
      },
      (firstGroupStyle === 'bottom' || firstGroupStyle === 'single') &&
        /*#__PURE__*/ _react.default.createElement(Avatar, {
          image:
            message === null || message === void 0
              ? void 0
              : (_message$user = message.user) === null ||
                _message$user === void 0
              ? void 0
              : _message$user.image,
          size: 32,
          name:
            (message === null || message === void 0
              ? void 0
              : (_message$user2 = message.user) === null ||
                _message$user2 === void 0
              ? void 0
              : _message$user2.name) ||
            (message === null || message === void 0
              ? void 0
              : (_message$user3 = message.user) === null ||
                _message$user3 === void 0
              ? void 0
              : _message$user3.id),
          onClick: onUserClick,
          onMouseOver: onUserHover,
        }),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message-commerce-inner',
        },
        message &&
          !message.text &&
          /*#__PURE__*/ _react.default.createElement(
            _react.default.Fragment,
            null,
            /*#__PURE__*/ _react.default.createElement(
              _MessageOptions.default,
              (0, _extends2.default)({}, props, {
                displayLeft: false,
                displayReplies: false,
                displayActions: false,
                onReactionListClick: onReactionListClick,
                theme: 'commerce',
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
              }),
            showDetailedReactions &&
              isReactionEnabled &&
              /*#__PURE__*/ _react.default.createElement(ReactionSelector, {
                reverse: false,
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
        (message === null || message === void 0 ? void 0 : message.mml) &&
          /*#__PURE__*/ _react.default.createElement(_MML.MML, {
            source: message.mml,
            actionHandler: handleAction,
            align: isMyMessage ? 'right' : 'left',
          }),
        (message === null || message === void 0 ? void 0 : message.text) &&
          /*#__PURE__*/ _react.default.createElement(_MessageText.default, {
            ReactionSelector: ReactionSelector,
            ReactionsList: ReactionsList,
            actionsEnabled: actionsEnabled,
            customWrapperClass: 'str-chat__message-commerce-text',
            customInnerClass: 'str-chat__message-commerce-text-inner',
            customOptionProps: {
              displayLeft: false,
              displayReplies: false,
              displayActions: false,
              theme: 'commerce',
            },
            getMessageActions: getMessageActions,
            message: message,
            messageListRect: props.messageListRect,
            unsafeHTML: props.unsafeHTML,
            onMentionsClickMessage: props.onMentionsClickMessage,
            onMentionsHoverMessage: props.onMentionsHoverMessage,
            theme: 'commerce',
          }),
        !threadList &&
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__message-commerce-reply-button',
            },
            /*#__PURE__*/ _react.default.createElement(
              _MessageRepliesCountButton.default,
              {
                onClick: propHandleOpenThread || handleOpenThread,
                reply_count:
                  message === null || message === void 0
                    ? void 0
                    : message.reply_count,
              },
            ),
          ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__message-commerce-data',
          },
          !isMyMessage
            ? /*#__PURE__*/ _react.default.createElement(
                'span',
                {
                  className: 'str-chat__message-commerce-name',
                },
                (message === null || message === void 0
                  ? void 0
                  : (_message$user4 = message.user) === null ||
                    _message$user4 === void 0
                  ? void 0
                  : _message$user4.name) ||
                  (message === null || message === void 0
                    ? void 0
                    : (_message$user5 = message.user) === null ||
                      _message$user5 === void 0
                    ? void 0
                    : _message$user5.id),
              )
            : null,
          /*#__PURE__*/ _react.default.createElement(
            _MessageTimestamp.default,
            {
              formatDate: formatDate,
              customClass: 'str-chat__message-commerce-timestamp',
              message: message,
              tDateTimeParser: propTDateTimeParser,
              format: 'LT',
            },
          ),
        ),
      ),
    ),
  );
};

MessageCommerce.propTypes = {
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
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   */
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

  /** Returns true if message belongs to current user */
  isMyMessage: _propTypes.default.func,

  /** Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply'] */
  getMessageActions: _propTypes.default.func.isRequired,

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
   */
  onMentionsHoverMessage: _propTypes.default.func,

  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   */
  onMentionsClickMessage: _propTypes.default.func,

  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: _propTypes.default.array,

  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserClick: _propTypes.default.func,

  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   * @deprecated This component now relies on the useUserHandler custom hook, and this prop will be removed on the next major release.
   */
  onUserHover: _propTypes.default.func,

  /** The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted:
    /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(
  MessageCommerce,
  _utils2.areMessagePropsEqual,
);

exports.default = _default;
