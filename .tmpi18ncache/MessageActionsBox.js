'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _utils = require('../Message/utils');

var _context = require('../../context');

/** @type {React.FC<import("types").MessageActionsBoxProps>} */
var MessageActionsBox = function MessageActionsBox(_ref) {
  var getMessageActions = _ref.getMessageActions,
    handleDelete = _ref.handleDelete,
    handleEdit = _ref.handleEdit,
    handleFlag = _ref.handleFlag,
    handleMute = _ref.handleMute,
    handlePin = _ref.handlePin,
    isUserMuted = _ref.isUserMuted,
    message = _ref.message,
    messageListRect = _ref.messageListRect,
    mine = _ref.mine,
    _ref$open = _ref.open,
    open = _ref$open === void 0 ? false : _ref$open;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    reverse = _useState2[0],
    setReverse = _useState2[1];

  var messageActions = getMessageActions();
  var checkIfReverse = (0, _react.useCallback)(
    function (containerElement) {
      if (!containerElement) {
        setReverse(false);
        return;
      }

      if (open) {
        var containerRect = containerElement.getBoundingClientRect();

        if (mine) {
          setReverse(
            !!messageListRect && containerRect.left < messageListRect.left,
          );
        } else {
          setReverse(
            !!messageListRect &&
              containerRect.right + 5 > messageListRect.right,
          );
        }
      }
    },
    [messageListRect, mine, open],
  );
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      'data-testid': 'message-actions-box',
      className: 'str-chat__message-actions-box\n        '
        .concat(open ? 'str-chat__message-actions-box--open' : '', '\n        ')
        .concat(mine ? 'str-chat__message-actions-box--mine' : '', '\n        ')
        .concat(
          reverse ? 'str-chat__message-actions-box--reverse' : '',
          '\n      ',
        ),
      ref: checkIfReverse,
    },
    /*#__PURE__*/ _react.default.createElement(
      'ul',
      {
        className: 'str-chat__message-actions-list',
      },
      messageActions.indexOf(_utils.MESSAGE_ACTIONS.pin) > -1 &&
        !(message !== null && message !== void 0 && message.parent_id) &&
        /*#__PURE__*/ _react.default.createElement(
          'button',
          {
            onClick: handlePin,
          },
          /*#__PURE__*/ _react.default.createElement(
            'li',
            {
              className: 'str-chat__message-actions-list-item',
            },
            !(message !== null && message !== void 0 && message.pinned)
              ? t('Pin')
              : t('Unpin'),
          ),
        ),
      messageActions.indexOf(_utils.MESSAGE_ACTIONS.flag) > -1 &&
        /*#__PURE__*/ _react.default.createElement(
          'button',
          {
            onClick: handleFlag,
          },
          /*#__PURE__*/ _react.default.createElement(
            'li',
            {
              className: 'str-chat__message-actions-list-item',
            },
            t('Flag'),
          ),
        ),
      messageActions.indexOf(_utils.MESSAGE_ACTIONS.mute) > -1 &&
        /*#__PURE__*/ _react.default.createElement(
          'button',
          {
            onClick: handleMute,
          },
          /*#__PURE__*/ _react.default.createElement(
            'li',
            {
              className: 'str-chat__message-actions-list-item',
            },
            isUserMuted && isUserMuted() ? t('Unmute') : t('Mute'),
          ),
        ),
      messageActions.indexOf(_utils.MESSAGE_ACTIONS.edit) > -1 &&
        /*#__PURE__*/ _react.default.createElement(
          'button',
          {
            onClick: handleEdit,
          },
          /*#__PURE__*/ _react.default.createElement(
            'li',
            {
              className: 'str-chat__message-actions-list-item',
            },
            t('Edit Message'),
          ),
        ),
      messageActions.indexOf(_utils.MESSAGE_ACTIONS.delete) > -1 &&
        /*#__PURE__*/ _react.default.createElement(
          'button',
          {
            onClick: handleDelete,
          },
          /*#__PURE__*/ _react.default.createElement(
            'li',
            {
              className: 'str-chat__message-actions-list-item',
            },
            t('Delete'),
          ),
        ),
    ),
  );
};

MessageActionsBox.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message:
    /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */
    _propTypes.default.object,

  /** If the message actions box should be open or not */
  open: _propTypes.default.bool,

  /** If message belongs to current user. */
  mine: _propTypes.default.bool,

  /** DOMRect object for parent MessageList component */
  messageListRect:
    /** @type {PropTypes.Validator<DOMRect>} */
    _propTypes.default.object,

  /**
   * Handler for flagging a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleFlag: _propTypes.default.func,

  /**
   * Handler for muting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleMute: _propTypes.default.func,

  /**
   * Handler for editing a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleEdit: _propTypes.default.func,

  /**
   * Handler for deleting a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handleDelete: _propTypes.default.func,

  /**
   * Handler for pinning a current message
   *
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  handlePin: _propTypes.default.func,

  /**
   * Returns array of available message actions for current message.
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   */
  getMessageActions: _propTypes.default.func.isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(MessageActionsBox);

exports.default = _default;
