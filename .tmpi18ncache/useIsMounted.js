'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = require('react');

var _default = function _default() {
  var isMounted = (0, _react.useRef)(true);
  (0, _react.useEffect)(function () {
    return function () {
      isMounted.current = false;
    };
  }, []);
  return isMounted;
};

exports.default = _default;
