'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.usePinHandler = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _utils = require('../utils');

var _context2 = require('../../../context');

/**
 * @type {import('types').usePinHandler}
 */
var usePinHandler = function usePinHandler(
  message,
  permissions,
  notifications,
) {
  var notify = notifications.notify,
    getErrorNotification = notifications.getErrorNotification;

  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    client = _useContext.client,
    channel = _useContext.channel;

  var _useContext2 = (0, _react.useContext)(_context2.TranslationContext),
    t = _useContext2.t;

  var canPin = function canPin() {
    var _client$user;

    if (
      !client ||
      !(channel !== null && channel !== void 0 && channel.state) ||
      !permissions ||
      !permissions[channel.type]
    ) {
      return false;
    }

    var currentChannelPermissions = permissions[channel.type];
    var currentChannelMember = channel.state.members[client.userID];
    var currentChannelWatcher = channel.state.watchers[client.userID];

    if (
      currentChannelPermissions &&
      currentChannelPermissions[
        (_client$user = client.user) === null || _client$user === void 0
          ? void 0
          : _client$user.role
      ]
    ) {
      return true;
    }

    if (
      currentChannelMember &&
      currentChannelPermissions[currentChannelMember.role]
    ) {
      return true;
    }

    if (
      currentChannelWatcher &&
      currentChannelPermissions[currentChannelWatcher.role]
    ) {
      return true;
    }

    return false;
  };

  var handlePin = /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(event) {
        var errorMessage, _errorMessage;

        return _regenerator.default.wrap(
          function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  event.preventDefault();

                  if (message) {
                    _context.next = 3;
                    break;
                  }

                  return _context.abrupt('return');

                case 3:
                  if (message.pinned) {
                    _context.next = 15;
                    break;
                  }

                  _context.prev = 4;
                  _context.next = 7;
                  return client.pinMessage(message);

                case 7:
                  _context.next = 13;
                  break;

                case 9:
                  _context.prev = 9;
                  _context.t0 = _context['catch'](4);
                  errorMessage =
                    getErrorNotification &&
                    (0, _utils.validateAndGetMessage)(getErrorNotification, [
                      message.user,
                    ]);
                  notify(errorMessage || t('Error pinning message'), 'error');

                case 13:
                  _context.next = 24;
                  break;

                case 15:
                  _context.prev = 15;
                  _context.next = 18;
                  return client.unpinMessage(message);

                case 18:
                  _context.next = 24;
                  break;

                case 20:
                  _context.prev = 20;
                  _context.t1 = _context['catch'](15);
                  _errorMessage =
                    getErrorNotification &&
                    (0, _utils.validateAndGetMessage)(getErrorNotification, [
                      message.user,
                    ]);
                  notify(
                    _errorMessage || t('Error removing message pin'),
                    'error',
                  );

                case 24:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [
            [4, 9],
            [15, 20],
          ],
        );
      }),
    );

    return function handlePin(_x) {
      return _ref.apply(this, arguments);
    };
  })();

  return {
    canPin: canPin(),
    handlePin,
  };
};

exports.usePinHandler = usePinHandler;
