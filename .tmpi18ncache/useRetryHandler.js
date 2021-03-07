'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useRetryHandler = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _context2 = require('../../../context');

// @ts-check

/**
 * @type {import('types').useRetryHandler}
 */
var useRetryHandler = function useRetryHandler(customRetrySendMessage) {
  /**
   *@type {import('types').ChannelContextValue}
   */
  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    contextRetrySendMessage = _useContext.retrySendMessage;

  var retrySendMessage = customRetrySendMessage || contextRetrySendMessage;
  return /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(message) {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                if (!(retrySendMessage && message)) {
                  _context.next = 3;
                  break;
                }

                _context.next = 3;
                return retrySendMessage(message);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    );

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  })();
};

exports.useRetryHandler = useRetryHandler;
