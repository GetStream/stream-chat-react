'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useBreakpoint = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = require('react');

var _lodash = _interopRequireDefault(require('lodash.throttle'));

/** @type {(width: number) => {device: 'mobile' | 'tablet' | 'full'; width: number}} */
var getDeviceWidth = function getDeviceWidth(width) {
  if (width < 768)
    return {
      device: 'mobile',
      width,
    };
  if (width < 1024)
    return {
      device: 'tablet',
      width,
    };
  return {
    device: 'full',
    width,
  };
};

var useBreakpoint = function useBreakpoint() {
  var _useState = (0, _react.useState)(getDeviceWidth(window.innerWidth)),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    breakpoint = _useState2[0],
    setBreakpoint = _useState2[1];

  (0, _react.useEffect)(function () {
    var getInnerWidth = (0, _lodash.default)(function () {
      return setBreakpoint(getDeviceWidth(window.innerWidth));
    }, 200);
    window.addEventListener('resize', getInnerWidth);
    return function () {
      return window.removeEventListener('resize', getInnerWidth);
    };
  }, []);
  return breakpoint;
};

exports.useBreakpoint = useBreakpoint;
