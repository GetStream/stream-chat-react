'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _context = require('../../context');

var _useUserRole2 = require('./hooks/useUserRole');

var _utils = require('./utils');

// @ts-check

/**
 * @type{React.FC<import('types').MessageDeletedProps>}
 */
var MessageDeleted = function MessageDeleted(props) {
  var message = props.message;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  var _useUserRole = (0, _useUserRole2.useUserRole)(message),
    isMyMessage = _useUserRole.isMyMessage;

  if (props.isMyMessage) {
    console.warn(
      'The isMyMessage is deprecated, and will be removed in the next major release.',
    );
  }

  var messageClasses =
    (props.isMyMessage && props.isMyMessage(message)) || isMyMessage
      ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
      : 'str-chat__message str-chat__message-simple';
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      key: message.id,
      className: ''
        .concat(messageClasses, ' str-chat__message--deleted ')
        .concat(message.type, ' '),
      'data-testid': 'message-deleted-component',
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__message--deleted-inner',
      },
      t && t('This message was deleted...'),
    ),
  );
};

MessageDeleted.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  // @ts-expect-error
  // Ignoring this for now as Typescript definitions on 'stream-chat' are wrong.
  message: _utils.MessagePropTypes,

  /** @deprecated This is no longer needed. The component should now rely on the user role custom hook */
  isMyMessage: _propTypes.default.func,
};
var _default = MessageDeleted;
exports.default = _default;
