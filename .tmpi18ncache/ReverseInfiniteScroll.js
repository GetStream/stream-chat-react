'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _react = _interopRequireDefault(require('react'));

var _InfiniteScroll = _interopRequireDefault(require('./InfiniteScroll'));

// @ts-check

/** @type {React.FC<import("types").InfiniteScrollProps>} */
var ReverseInfiniteScroll = function ReverseInfiniteScroll(props) {
  return /*#__PURE__*/ _react.default.createElement(
    _InfiniteScroll.default,
    (0, _extends2.default)({}, props, {
      isReverse: true,
    }),
  );
};

var _default = ReverseInfiniteScroll;
exports.default = _default;
