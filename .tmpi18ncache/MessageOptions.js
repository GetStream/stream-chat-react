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

var _hooks = require('./hooks');

var _context = require('../../context');

var _MessageActions = require('../MessageActions');

var _utils = require('./utils');

var _icons = require('./icons');

// @ts-check

/**
 * @type { React.FC<import('types').MessageOptionsProps> }
 */
var MessageOptionsComponent = function MessageOptionsComponent(props) {
  var _props$displayActions = props.displayActions,
    displayActions =
      _props$displayActions === void 0 ? true : _props$displayActions,
    _props$displayLeft = props.displayLeft,
    displayLeft = _props$displayLeft === void 0 ? true : _props$displayLeft,
    _props$displayReplies = props.displayReplies,
    displayReplies =
      _props$displayReplies === void 0 ? true : _props$displayReplies,
    propHandleOpenThread = props.handleOpenThread,
    initialMessage = props.initialMessage,
    message = props.message,
    messageWrapperRef = props.messageWrapperRef,
    onReactionListClick = props.onReactionListClick,
    _props$theme = props.theme,
    theme = _props$theme === void 0 ? 'simple' : _props$theme,
    threadList = props.threadList;

  var _useUserRole = (0, _hooks.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  var handleOpenThread = (0, _hooks.useOpenThreadHandler)(message);
  /**
   * @type {import('types').ChannelContextValue}
   */

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channel = _useContext.channel;

  var channelConfig =
    channel === null || channel === void 0 ? void 0 : channel.getConfig();
  var messageActions = props.getMessageActions();
  var shouldShowReactions =
    messageActions.indexOf(_utils.MESSAGE_ACTIONS.react) > -1 &&
    channelConfig &&
    channelConfig.reactions;
  var shouldShowReplies =
    messageActions.indexOf(_utils.MESSAGE_ACTIONS.reply) > -1 &&
    displayReplies &&
    !threadList &&
    channelConfig &&
    channelConfig.replies;

  if (
    !message ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
    return null;
  }

  if (isMyMessage && displayLeft) {
    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-options-left',
        className: 'str-chat__message-'.concat(theme, '__actions'),
      },
      displayActions &&
        /*#__PURE__*/ _react.default.createElement(
          _MessageActions.MessageActions,
          (0, _extends2.default)({}, props, {
            messageWrapperRef: messageWrapperRef,
          }),
        ),
      shouldShowReplies &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            'data-testid': 'thread-action',
            onClick: propHandleOpenThread || handleOpenThread,
            className: 'str-chat__message-'
              .concat(theme, '__actions__action str-chat__message-')
              .concat(theme, '__actions__action--thread'),
          },
          /*#__PURE__*/ _react.default.createElement(_icons.ThreadIcon, null),
        ),
      shouldShowReactions &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            'data-testid': 'message-reaction-action',
            className: 'str-chat__message-'
              .concat(theme, '__actions__action str-chat__message-')
              .concat(theme, '__actions__action--reactions'),
            onClick: onReactionListClick,
          },
          /*#__PURE__*/ _react.default.createElement(_icons.ReactionIcon, null),
        ),
    );
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      'data-testid': 'message-options',
      className: 'str-chat__message-'.concat(theme, '__actions'),
    },
    shouldShowReactions &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          'data-testid': 'message-reaction-action',
          className: 'str-chat__message-'
            .concat(theme, '__actions__action str-chat__message-')
            .concat(theme, '__actions__action--reactions'),
          onClick: onReactionListClick,
        },
        /*#__PURE__*/ _react.default.createElement(_icons.ReactionIcon, null),
      ),
    shouldShowReplies &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          onClick: propHandleOpenThread || handleOpenThread,
          'data-testid': 'thread-action',
          className: 'str-chat__message-'
            .concat(theme, '__actions__action str-chat__message-')
            .concat(theme, '__actions__action--thread'),
        },
        /*#__PURE__*/ _react.default.createElement(_icons.ThreadIcon, null),
      ),
    displayActions &&
      /*#__PURE__*/ _react.default.createElement(
        _MessageActions.MessageActions,
        (0, _extends2.default)({}, props, {
          messageWrapperRef: messageWrapperRef,
        }),
      ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(MessageOptionsComponent);

exports.default = _default;
