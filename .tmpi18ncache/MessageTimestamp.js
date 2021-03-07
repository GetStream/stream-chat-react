'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.noParsingFunctionWarning = exports.notValidDateWarning = exports.defaultTimestampFormat = void 0;

var _react = _interopRequireWildcard(require('react'));

var _context = require('../../context');

// @ts-check
var defaultTimestampFormat = 'h:mmA';
exports.defaultTimestampFormat = defaultTimestampFormat;
var notValidDateWarning =
  'MessageTimestamp was called without a message, or message has invalid created_at date.';
exports.notValidDateWarning = notValidDateWarning;
var noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';
/**
 * @type { (
 *   messageCreatedAt?: string,
 *   formatDate?: import('types').MessageTimestampProps['formatDate'],
 *   calendar?: boolean,
 *   tDateTimeParser?: import('types').MessageTimestampProps['tDateTimeParser'],
 *   format?: string,
 * ) => string | null }
 */

exports.noParsingFunctionWarning = noParsingFunctionWarning;

function getDateString(
  messageCreatedAt,
  formatDate,
  calendar,
  tDateTimeParser,
  format,
) {
  if (!messageCreatedAt || !Date.parse(messageCreatedAt)) {
    console.warn(notValidDateWarning);
    return null;
  }

  if (typeof formatDate === 'function') {
    return formatDate(new Date(messageCreatedAt));
  }

  if (!tDateTimeParser) {
    console.warn(noParsingFunctionWarning);
    return null;
  }

  var parsedTime = tDateTimeParser(messageCreatedAt);

  if (calendar && typeof parsedTime.calendar !== 'function') {
    return null;
  }

  return calendar ? parsedTime.calendar() : parsedTime.format(format);
}
/**
 * @typedef { import('types').MessageTimestampProps } Props
 * @type { React.FC<Props> }
 */

var MessageTimestamp = function MessageTimestamp(props) {
  var message = props.message,
    formatDate = props.formatDate,
    propTDatetimeParser = props.tDateTimeParser,
    _props$customClass = props.customClass,
    customClass = _props$customClass === void 0 ? '' : _props$customClass,
    _props$format = props.format,
    format = _props$format === void 0 ? defaultTimestampFormat : _props$format,
    _props$calendar = props.calendar,
    calendar = _props$calendar === void 0 ? false : _props$calendar;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    contextTDateTimeParser = _useContext.tDateTimeParser;

  var tDateTimeParser = propTDatetimeParser || contextTDateTimeParser;
  var createdAt =
    message === null || message === void 0 ? void 0 : message.created_at;
  var when = (0, _react.useMemo)(
    function () {
      return getDateString(
        createdAt,
        formatDate,
        calendar,
        tDateTimeParser,
        format,
      );
    },
    [formatDate, calendar, tDateTimeParser, format, createdAt],
  );

  if (!when) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    'time',
    {
      className: customClass,
      dateTime: createdAt,
      title: createdAt,
    },
    when,
  );
};

var _default = /*#__PURE__*/ _react.default.memo(MessageTimestamp);

exports.default = _default;
