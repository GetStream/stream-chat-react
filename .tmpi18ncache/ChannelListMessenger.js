'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = exports.ChannelListMessenger = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _ChatDown = require('../ChatDown');

var _Loading = require('../Loading');

// @ts-check

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('types').ChannelListUIComponentProps>
 */
var ChannelListMessenger = function ChannelListMessenger(_ref) {
  var _ref$error = _ref.error,
    error = _ref$error === void 0 ? false : _ref$error,
    loading = _ref.loading,
    _ref$LoadingErrorIndi = _ref.LoadingErrorIndicator,
    LoadingErrorIndicator =
      _ref$LoadingErrorIndi === void 0
        ? _ChatDown.ChatDown
        : _ref$LoadingErrorIndi,
    _ref$LoadingIndicator = _ref.LoadingIndicator,
    LoadingIndicator =
      _ref$LoadingIndicator === void 0
        ? _Loading.LoadingChannels
        : _ref$LoadingIndicator,
    children = _ref.children;

  if (error) {
    return /*#__PURE__*/ _react.default.createElement(LoadingErrorIndicator, {
      type: 'Connection Error',
    });
  }

  if (loading) {
    return /*#__PURE__*/ _react.default.createElement(LoadingIndicator, null);
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__channel-list-messenger',
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__channel-list-messenger__main',
      },
      children,
    ),
  );
};

exports.ChannelListMessenger = ChannelListMessenger;
ChannelListMessenger.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: _propTypes.default.bool,

  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: _propTypes.default.bool,

  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */
    _propTypes.default.elementType,
};
var _default = ChannelListMessenger;
exports.default = _default;
