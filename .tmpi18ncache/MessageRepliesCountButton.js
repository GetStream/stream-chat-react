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

var _icons = require('./icons');

// @ts-check

/** @type {React.FC<import("types").MessageRepliesCountButtonProps>} */
var MessageRepliesCountButton = function MessageRepliesCountButton(_ref) {
  var reply_count = _ref.reply_count,
    labelSingle = _ref.labelSingle,
    labelPlural = _ref.labelPlural,
    onClick = _ref.onClick;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  var singleReplyText;
  var pluralReplyText;

  if (reply_count === 1) {
    if (labelSingle) {
      singleReplyText = '1 '.concat(labelSingle);
    } else {
      singleReplyText = t('1 reply');
    }
  }

  if (reply_count && reply_count > 1) {
    if (labelPlural) {
      pluralReplyText = ''.concat(reply_count, ' ').concat(labelPlural);
    } else {
      pluralReplyText = t('{{ replyCount }} replies', {
        replyCount: reply_count,
      });
    }
  }

  if (reply_count && reply_count !== 0) {
    return /*#__PURE__*/ _react.default.createElement(
      'button',
      {
        'data-testid': 'replies-count-button',
        className: 'str-chat__message-replies-count-button',
        onClick: onClick,
      },
      /*#__PURE__*/ _react.default.createElement(_icons.ReplyIcon, null),
      reply_count === 1 ? singleReplyText : pluralReplyText,
    );
  }

  return null;
};

MessageRepliesCountButton.defaultProps = {
  reply_count: 0,
};
MessageRepliesCountButton.propTypes = {
  /** Label for number of replies, when count is 1 */
  labelSingle: _propTypes.default.string,

  /** Label for number of replies, when count is more than 1 */
  labelPlural: _propTypes.default.string,

  /** Number of replies */
  reply_count: _propTypes.default.number,

  /**
   * click handler for button
   * @param event React's MouseEventHandler event
   * @returns void
   * */
  onClick: _propTypes.default.func,
};

var _default = /*#__PURE__*/ _react.default.memo(MessageRepliesCountButton);

exports.default = _default;
