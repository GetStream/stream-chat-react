'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _useFlagHandler = require('../useFlagHandler');

var _context8 = require('../../../../context');

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

var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var flagMessage = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseHandleFlagHook() {
  return _renderUseHandleFlagHook.apply(this, arguments);
}

function _renderUseHandleFlagHook() {
  _renderUseHandleFlagHook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
      var message,
        notificationOpts,
        channelContextValue,
        client,
        channel,
        wrapper,
        _renderHook,
        result,
        _args7 = arguments;

      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch ((_context7.prev = _context7.next)) {
            case 0:
              message =
                _args7.length > 0 && _args7[0] !== undefined
                  ? _args7[0]
                  : (0, _mockBuilders.generateMessage)();
              notificationOpts = _args7.length > 1 ? _args7[1] : undefined;
              channelContextValue = _args7.length > 2 ? _args7[2] : undefined;
              _context7.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context7.sent;
              client.flagMessage = flagMessage;
              channel = (0, _mockBuilders.generateChannel)();

              wrapper = function wrapper(_ref7) {
                var children = _ref7.children;
                return /*#__PURE__*/ _react.default.createElement(
                  _context8.ChannelContext.Provider,
                  {
                    value: _objectSpread(
                      {
                        channel,
                        client,
                      },
                      channelContextValue,
                    ),
                  },
                  children,
                );
              };

              (_renderHook = (0, _reactHooks.renderHook)(
                function () {
                  return (0, _useFlagHandler.useFlagHandler)(
                    message,
                    notificationOpts,
                  );
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook.result);
              return _context7.abrupt('return', result.current);

            case 11:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7);
    }),
  );
  return _renderUseHandleFlagHook.apply(this, arguments);
}

describe('useHandleFlag custom hook', function () {
  afterEach(jest.clearAllMocks);
  it(
    'should generate function that handles mutes',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var handleFlag;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderUseHandleFlagHook();

              case 2:
                handleFlag = _context.sent;
                expect(typeof handleFlag).toBe('function');

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should throw a warning when there are missing parameters and the handler is called',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var consoleWarnSpy, handleFlag;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                consoleWarnSpy = jest
                  .spyOn(console, 'warn')
                  .mockImplementationOnce(function () {
                    return null;
                  });
                _context2.next = 3;
                return renderUseHandleFlagHook(undefined);

              case 3:
                handleFlag = _context2.sent;
                _context2.next = 6;
                return handleFlag(mouseEventMock);

              case 6:
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                  _useFlagHandler.missingUseFlagHandlerParameterWarning,
                );

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var message,
          notify,
          messageFlaggedNotification,
          getSuccessNotification,
          handleFlag;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                notify = jest.fn();
                flagMessage.mockImplementationOnce(function () {
                  return Promise.resolve();
                });
                messageFlaggedNotification = 'Message flagged!';
                getSuccessNotification = jest.fn(function () {
                  return messageFlaggedNotification;
                });
                _context3.next = 7;
                return renderUseHandleFlagHook(message, {
                  notify,
                  getSuccessNotification,
                });

              case 7:
                handleFlag = _context3.sent;
                _context3.next = 10;
                return handleFlag(mouseEventMock);

              case 10:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(notify).toHaveBeenCalledWith(
                  messageFlaggedNotification,
                  'success',
                );

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var message, notify, defaultSuccessNotification, handleFlag;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                notify = jest.fn();
                flagMessage.mockImplementationOnce(function () {
                  return Promise.resolve();
                });
                defaultSuccessNotification =
                  'Message has been successfully flagged';
                _context4.next = 6;
                return renderUseHandleFlagHook(message, {
                  notify,
                });

              case 6:
                handleFlag = _context4.sent;
                _context4.next = 9;
                return handleFlag(mouseEventMock);

              case 9:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultSuccessNotification,
                  'success',
                );

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with custom error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var message,
          notify,
          messageFlagFailedNotification,
          getErrorNotification,
          handleFlag;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                notify = jest.fn();
                flagMessage.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                messageFlagFailedNotification = 'Message flagged failed!';
                getErrorNotification = jest.fn(function () {
                  return messageFlagFailedNotification;
                });
                _context5.next = 7;
                return renderUseHandleFlagHook(message, {
                  notify,
                  getErrorNotification,
                });

              case 7:
                handleFlag = _context5.sent;
                _context5.next = 10;
                return handleFlag(mouseEventMock);

              case 10:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(notify).toHaveBeenCalledWith(
                  messageFlagFailedNotification,
                  'error',
                );

              case 12:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should allow to flag a user and notify with default error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message, notify, defaultFlagMessageFailedNotification, handleFlag;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                notify = jest.fn();
                flagMessage.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                defaultFlagMessageFailedNotification =
                  'Error adding flag: Either the flag already exist or there is issue with network connection ...';
                _context6.next = 6;
                return renderUseHandleFlagHook(message, {
                  notify,
                });

              case 6:
                handleFlag = _context6.sent;
                _context6.next = 9;
                return handleFlag(mouseEventMock);

              case 9:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultFlagMessageFailedNotification,
                  'error',
                );

              case 11:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
});
