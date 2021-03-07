'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useDeleteHandler = void 0;

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
 * @type {import('types').useDeleteHandler}
 */
var useDeleteHandler = function useDeleteHandler(message) {
  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    updateMessage = _useContext.updateMessage,
    client = _useContext.client;

  return /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(event) {
        var data;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                event.preventDefault();

                if (
                  !(
                    !(message !== null && message !== void 0 && message.id) ||
                    !client ||
                    !updateMessage
                  )
                ) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return');

              case 3:
                _context.next = 5;
                return client.deleteMessage(message.id);

              case 5:
                data = _context.sent;
                updateMessage(data.message);

              case 7:
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

exports.useDeleteHandler = useDeleteHandler;
