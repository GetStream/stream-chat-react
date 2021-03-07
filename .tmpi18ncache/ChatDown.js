'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _Loading = require('../Loading');

var _context = require('../../context');

var _strChat__connectionError = _interopRequireDefault(
  require('../../assets/str-chat__connection-error.svg'),
);

// @ts-check

/**
 * ChatDown - Indicator that chat is down or your network isn't working
 * @example ../../docs/ChatDown.md
 * @typedef {import('types').ChatDownProps} Props
 * @type {React.FC<Props>}
 */
var ChatDown = function ChatDown(_ref) {
  var image = _ref.image,
    _ref$type = _ref.type,
    type = _ref$type === void 0 ? 'Error' : _ref$type,
    text = _ref.text;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t;

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__down',
    },
    /*#__PURE__*/ _react.default.createElement(_Loading.LoadingChannels, null),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__down-main',
      },
      /*#__PURE__*/ _react.default.createElement('img', {
        'data-testid': 'chatdown-img',
        src: image || _strChat__connectionError.default,
      }),
      /*#__PURE__*/ _react.default.createElement('h1', null, type),
      /*#__PURE__*/ _react.default.createElement(
        'h3',
        null,
        text || t('Error connecting to chat, refresh the page to try again.'),
      ),
    ),
  );
};

ChatDown.propTypes = {
  /** The image url for this error */
  image: _propTypes.default.string,

  /** The type of error */
  type: _propTypes.default.string.isRequired,

  /** The error message to show */
  text: _propTypes.default.string,
};

var _default = /*#__PURE__*/ _react.default.memo(ChatDown);

exports.default = _default;
