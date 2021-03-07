'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.useFlagHandler = exports.missingUseFlagHandlerParameterWarning = void 0;

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = require('react');

var _context2 = require('../../../context');

var _utils = require('../utils');

// @ts-check
var missingUseFlagHandlerParameterWarning =
  'useFlagHandler was called but it is missing one or more necessary parameters.';
/**
 * @type {import('types').useFlagHandler}
 */

exports.missingUseFlagHandlerParameterWarning = missingUseFlagHandlerParameterWarning;

var useFlagHandler = function useFlagHandler(message) {
  var notifications =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var _useContext = (0, _react.useContext)(_context2.ChannelContext),
    client = _useContext.client;

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
          errorMessage;
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
                      !client ||
                      !t ||
                      !notify ||
                      !(message !== null && message !== void 0 && message.id)
                    )
                  ) {
                    _context.next = 5;
                    break;
                  }

                  console.warn(missingUseFlagHandlerParameterWarning);
                  return _context.abrupt('return');

                case 5:
                  _context.prev = 5;
                  _context.next = 8;
                  return client.flagMessage(message.id);

                case 8:
                  successMessage =
                    getSuccessNotification &&
                    (0, _utils.validateAndGetMessage)(getSuccessNotification, [
                      message,
                    ]);
                  notify(
                    successMessage ||
                      t('Message has been successfully flagged'),
                    'success',
                  );
                  _context.next = 16;
                  break;

                case 12:
                  _context.prev = 12;
                  _context.t0 = _context['catch'](5);
                  errorMessage =
                    getErrorNotification &&
                    (0, _utils.validateAndGetMessage)(getErrorNotification, [
                      message,
                    ]);
                  notify(
                    errorMessage ||
                      t(
                        'Error adding flag: Either the flag already exist or there is issue with network connection ...',
                      ),
                    'error',
                  );

                case 16:
                case 'end':
                  return _context.stop();
              }
            }
          },
          _callee,
          null,
          [[5, 12]],
        );
      }),
    );

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  })();
};

exports.useFlagHandler = useFlagHandler;
