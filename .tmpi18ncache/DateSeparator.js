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

// @ts-check

/**
 * DateSeparator - A simple date separator
 *
 * @example ../../docs/DateSeparator.md
 * @type {React.FC<import('types').DateSeparatorProps>}
 */
var DateSeparator = function DateSeparator(_ref) {
  var _ref$position = _ref.position,
    position = _ref$position === void 0 ? 'right' : _ref$position,
    formatDate = _ref.formatDate,
    date = _ref.date,
    unread = _ref.unread;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t,
    tDateTimeParser = _useContext.tDateTimeParser;

  if (typeof date === 'string') return null;
  var formattedDate = formatDate
    ? formatDate(date)
    : tDateTimeParser(date.toISOString()).calendar();
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__date-separator',
    },
    (position === 'right' || position === 'center') &&
      /*#__PURE__*/ _react.default.createElement('hr', {
        className: 'str-chat__date-separator-line',
      }),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__date-separator-date',
      },
      unread ? t('New') : formattedDate,
    ),
    (position === 'left' || position === 'center') &&
      /*#__PURE__*/ _react.default.createElement('hr', {
        className: 'str-chat__date-separator-line',
      }),
  );
};

DateSeparator.propTypes = {
  /** The date to format */
  date: _propTypes.default.instanceOf(Date).isRequired,

  /** If following messages are not new */
  unread: _propTypes.default.bool,

  /** Set the position of the date in the separator */
  position: _propTypes.default.oneOf(['left', 'center', 'right']),

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: _propTypes.default.func,
};

var _default = /*#__PURE__*/ _react.default.memo(DateSeparator);

exports.default = _default;
