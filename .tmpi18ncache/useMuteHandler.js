'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useMuteHandler = exports.missingUseMuteHandlerParamsWarning = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _utils = require('../utils');

var _context2 = require('../../../context');

// @ts-check
var missingUseMuteHandlerParamsWarning =
  'useMuteHandler was called but it is missing one or more necessary parameter.';
/**
 * @type {import('types').useMuteHandler}
 */

exports.missingUseMuteHandlerParamsWarning = missingUseMuteHandlerParamsWarning;

var useMuteHandler = function useMuteHandler(message) {
  var notifications =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    client = _useContext.client,
    mutes = _useContext.mutes;

  var _useContext2 = (0, _react.useContext)(_context2.TranslationContext),
    t = _useContext2.t;
  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */

  return /*#__PURE__*/ (function () {
    var _ref = (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee(event) {
        var notify,
          getSuccessNotification,
          getErrorNotification,
          successMessage,
          errorMessage,
          fallbackMessage,
          _successMessage,
          _errorMessage;

        return _regenerator.default.wrap(
          function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  event.preventDefault();
                  (notify = notifications.notify),
                    (getSuccessNotification =
                      notifications.getSuccessNotification),
                    (getErrorNotification = notifications.getErrorNotification);

                  if (
                    !(
                      !t ||
                      !(
                        message !== null &&
                        message !== void 0 &&
                        message.user
                      ) ||
                      !notify ||
                      !client
                    )
                  ) {
                    _context.next = 5;
                    break;
                  }

                  console.warn(missingUseMuteHandlerParamsWarning);
                  return _context.abrupt('return');

                case 5:
                  if ((0, _utils.isUserMuted)(message, mutes)) {
                    _context.next = 19;
                    break;
                  }

                  _context.prev = 6;
                  _context.next = 9;
                  return client.muteUser(message.user.id);

                case 9:
                  successMessage =
                    getSuccessNotification &&
                    (0, _utils.validateAndGetMessage)(getSuccessNotification, [
                      message.user,
                    ]);
                  notify(
                    successMessage ||
                      t('{{ user }} has been muted', {
                        user: message.user.name || message.user.id,
                      }),
                    'success',
                  );
                  _context.next = 17;
                  break;

                case 13:
                  _context.prev = 13;
                  _context.t0 = _context['catch'](6);
                  errorMessage =
                    getErrorNotification &&
                    (0, _utils.validateAndGetMessage)(getErrorNotification, [
                      message.user,
                    ]);
                  notify(errorMessage || t('Error muting a user ...'), 'error');

                case 17:
                  _context.next = 31;
                  break;

                case 19:
                  _context.prev = 19;
                  _context.next = 22;
                  return client.unmuteUser(message.user.id);

                case 22:
                  fallbackMessage = t('{{ user }} has been unmuted', {
                    user: message.user.name || message.user.id,
                  });
                  _successMessage =
                    (getSuccessNotification &&
                      (0, _utils.validateAndGetMessage)(
                        getSuccessNotification,
                        [message.user],
                      )) ||
                    fallbackMessage;

                  if (typeof _successMessage === 'string') {
                    notify(_successMessage, 'success');
                  }

                  _context.next = 31;
                  break;

                case 27:
                  _context.prev = 27;
                  _context.t1 = _context['catch'](19);
                  _errorMessage =
                    (getErrorNotification &&
                      (0, _utils.validateAndGetMessage)(getErrorNotification, [
                        message.user,
                      ])) ||
                    t('Error unmuting a user ...');

                  if (typeof _errorMessage === 'string') {
                    notify(_errorMessage, 'error');
                  }

                case 31:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [
            [6, 13],
            [19, 27],
          ],
        );
      }),
    );

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  })();
};

exports.useMuteHandler = useMuteHandler;
