'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useActionHandler = exports.handleActionWarning = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _context2 = require('../../../context');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

var handleActionWarning =
  'Action handler was called, but it is missing one of its required arguments.\n      Make sure the ChannelContext was properly set and that this hook was initialized with a valid message.';
/**
 * @type {import('types').useActionHandler}
 */

exports.handleActionWarning = handleActionWarning;

var useActionHandler = function useActionHandler(message) {
  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    channel = _useContext.channel,
    updateMessage = _useContext.updateMessage,
    removeMessage = _useContext.removeMessage;

  return /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(
        dataOrName,
        value,
        event,
      ) {
        var messageID, formData, data;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                if (event) event.preventDefault();

                if (
                  !(!message || !updateMessage || !removeMessage || !channel)
                ) {
                  _context.next = 4;
                  break;
                }

                console.warn(handleActionWarning);
                return _context.abrupt('return');

              case 4:
                messageID = message.id; // deprecated: value&name should be removed in favor of data obj

                /** @type {Record<string, any>} */

                formData = {};
                if (typeof dataOrName === 'string')
                  formData[dataOrName] = value;
                else formData = _objectSpread({}, dataOrName);

                if (!messageID) {
                  _context.next = 12;
                  break;
                }

                _context.next = 10;
                return channel.sendAction(messageID, formData);

              case 10:
                data = _context.sent;

                if (data !== null && data !== void 0 && data.message) {
                  updateMessage(data.message);
                } else {
                  removeMessage(message);
                }

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    );

    return function (_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  })();
};

exports.useActionHandler = useActionHandler;
