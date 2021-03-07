'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

// @ts-check
var LoadingItems = function LoadingItems() {
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__loading-channels-item',
    },
    /*#__PURE__*/ _react.default.createElement('div', {
      className: 'str-chat__loading-channels-avatar',
    }),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__loading-channels-meta',
      },
      /*#__PURE__*/ _react.default.createElement('div', {
        className: 'str-chat__loading-channels-username',
      }),
      /*#__PURE__*/ _react.default.createElement('div', {
        className: 'str-chat__loading-channels-status',
      }),
    ),
  );
};
/**
 * LoadingChannels - Fancy loading indicator for the channel list
 *
 * @example ../../docs/LoadingChannels.md
 */

var LoadingChannels = function LoadingChannels() {
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__loading-channels',
    },
    /*#__PURE__*/ _react.default.createElement(LoadingItems, null),
    /*#__PURE__*/ _react.default.createElement(LoadingItems, null),
    /*#__PURE__*/ _react.default.createElement(LoadingItems, null),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(LoadingChannels);

exports.default = _default;
