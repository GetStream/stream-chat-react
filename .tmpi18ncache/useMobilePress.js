'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useMobilePress = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = require('react');

var _useBreakpoint = require('./useBreakpoint');

var useMobilePress = function useMobilePress() {
  var _useState = (0, _react.useState)(null),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    targetMessage = _useState2[0],
    setTargetMessage = _useState2[1];

  var breakpoint = (0, _useBreakpoint.useBreakpoint)();
  /** @type {(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void} */

  var handleMobilePress = function handleMobilePress(event) {
    if (event.target instanceof HTMLElement && breakpoint.device === 'mobile') {
      var closestMessage = event.target.closest('.str-chat__message-simple');
      if (!closestMessage) return;
      setTargetMessage(closestMessage);

      if (closestMessage.classList.contains('mobile-press')) {
        closestMessage.classList.remove('mobile-press');
      } else {
        closestMessage.classList.add('mobile-press');
      }
    }
  };

  (0, _react.useEffect)(
    function () {
      var handleClick = function handleClick(event) {
        var isClickInside =
          targetMessage === null || targetMessage === void 0
            ? void 0
            : targetMessage.contains(event.target);

        if (!isClickInside && targetMessage) {
          targetMessage.classList.remove('mobile-press');
        }
      };

      if (breakpoint.device === 'mobile') {
        document.addEventListener('click', handleClick);
      }

      return function () {
        return document.removeEventListener('click', handleClick);
      };
    },
    [breakpoint, targetMessage],
  );
  return {
    handleMobilePress,
  };
};

exports.useMobilePress = useMobilePress;
