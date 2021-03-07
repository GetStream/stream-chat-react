'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _MessageTimestamp = _interopRequireDefault(require('./MessageTimestamp'));

var _Avatar = require('../Avatar');

var _MML = require('../MML');

var _utils = require('../../utils');

var _context = require('../../context');

var _Gallery = require('../Gallery');

var _MessageActions = require('../MessageActions');

var _hooks = require('./hooks');

var _utils2 = require('./utils');

// @ts-check

/**
 * @param { number } number
 * @param { boolean } dark
 */
var selectColor = function selectColor(number, dark) {
  var hue = number * 137.508; // use golden angle approximation

  return 'hsl('
    .concat(hue, ',')
    .concat(dark ? '50%' : '85%', ', ')
    .concat(dark ? '75%' : '55%', ')');
};
/**
 * @param { string } userId
 */

var hashUserId = function hashUserId(userId) {
  var hash = userId.split('').reduce(function (acc, c) {
    acc = (acc << 5) - acc + c.charCodeAt(0); // eslint-disable-line

    return acc & acc; // eslint-disable-line no-bitwise
  }, 0);
  return (
    Math.abs(hash) / Math.pow(10, Math.ceil(Math.log10(Math.abs(hash) + 1)))
  );
};
/**
 * @param { string } theme
 * @param { string } userId
 */

var getUserColor = function getUserColor(theme, userId) {
  return selectColor(hashUserId(userId), theme.includes('dark'));
};
/**
 * FixedHeightMessage - This component renders a single message.
 * It uses fixed height elements to make sure it works well in VirtualizedMessageList
 * @type {React.FC<import('types').FixedHeightMessageProps>}
 */

var FixedHeightMessage = function FixedHeightMessage(_ref) {
  var _message$i18n,
    _message$user,
    _message$attachments,
    _message$user2,
    _message$user3,
    _message$user4,
    _message$user5;

  var message = _ref.message,
    groupedByUser = _ref.groupedByUser;

  var _useContext = (0, _react.useContext)(_context.ChatContext),
    theme = _useContext.theme;

  var _useContext2 = (0, _react.useContext)(_context.TranslationContext),
    userLanguage = _useContext2.userLanguage;

  var role = (0, _hooks.useUserRole)(message);
  var handleAction = (0, _hooks.useActionHandler)(message);
  var messageTextToRender = // @ts-expect-error
    (message === null || message === void 0
      ? void 0
      : (_message$i18n = message.i18n) === null || _message$i18n === void 0
      ? void 0
      : _message$i18n[''.concat(userLanguage, '_text')]) ||
    (message === null || message === void 0 ? void 0 : message.text);
  var renderedText = (0, _react.useMemo)(
    function () {
      return (0, _utils.renderText)(
        messageTextToRender,
        message.mentioned_users,
      );
    },
    [message.mentioned_users, messageTextToRender],
  );
  var userId =
    (_message$user = message.user) === null || _message$user === void 0
      ? void 0
      : _message$user.id; // @ts-expect-error

  var userColor = (0, _react.useMemo)(
    function () {
      return getUserColor(theme, userId);
    },
    [userId, theme],
  );
  var messageActionsHandler = (0, _react.useCallback)(
    function () {
      return (0, _utils2.getMessageActions)(['delete'], {
        canDelete: role.canDeleteMessage,
      });
    },
    [role],
  );
  var images =
    message === null || message === void 0
      ? void 0
      : (_message$attachments = message.attachments) === null ||
        _message$attachments === void 0
      ? void 0
      : _message$attachments.filter(function (_ref2) {
          var type = _ref2.type;
          return type === 'image';
        });
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      key: message.id,
      className: 'str-chat__virtual-message__wrapper '
        .concat(
          role.isMyMessage ? 'str-chat__virtual-message__wrapper--me' : '',
          ' ',
        )
        .concat(
          groupedByUser ? 'str-chat__virtual-message__wrapper--group' : '',
        ),
    },
    /*#__PURE__*/ _react.default.createElement(_Avatar.Avatar, {
      shape: 'rounded',
      size: 38, // @ts-expect-error
      image:
        (_message$user2 = message.user) === null || _message$user2 === void 0
          ? void 0
          : _message$user2.image,
      name:
        ((_message$user3 = message.user) === null || _message$user3 === void 0
          ? void 0
          : _message$user3.name) ||
        ((_message$user4 = message.user) === null || _message$user4 === void 0
          ? void 0
          : _message$user4.id),
    }),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__virtual-message__content',
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__virtual-message__meta',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__virtual-message__author',
            style: {
              color: userColor,
            },
          },
          /*#__PURE__*/ _react.default.createElement(
            'strong',
            null,
            ((_message$user5 = message.user) === null ||
            _message$user5 === void 0
              ? void 0
              : _message$user5.name) || 'unknown',
          ),
        ),
      ),
      images &&
        /*#__PURE__*/ _react.default.createElement(_Gallery.Gallery, {
          images: images,
        }),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__virtual-message__text',
          'data-testid': 'msg-text',
        },
        renderedText,
        message.mml &&
          /*#__PURE__*/ _react.default.createElement(_MML.MML, {
            source: message.mml,
            actionHandler: handleAction,
            align: 'left',
          }),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__virtual-message__data',
          },
          /*#__PURE__*/ _react.default.createElement(
            _MessageActions.MessageActions,
            {
              message: message,
              customWrapperClass: 'str-chat__virtual-message__actions',
              getMessageActions: messageActionsHandler,
            },
          ),
          /*#__PURE__*/ _react.default.createElement(
            'span',
            {
              className: 'str-chat__virtual-message__date',
            },
            /*#__PURE__*/ _react.default.createElement(
              _MessageTimestamp.default,
              {
                customClass: 'str-chat__message-simple-timestamp',
                message: message,
              },
            ),
          ),
        ),
      ),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(FixedHeightMessage);

exports.default = _default;
