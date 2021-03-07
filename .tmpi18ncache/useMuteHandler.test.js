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

var _context12 = require('../../../../context');

var _useMuteHandler = require('../useMuteHandler');

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
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});
var muteUser = jest.fn();
var unmuteUser = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseHandleMuteHook() {
  return _renderUseHandleMuteHook.apply(this, arguments);
}

function _renderUseHandleMuteHook() {
  _renderUseHandleMuteHook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
      var message,
        notificationOpts,
        channelContextValue,
        client,
        channel,
        wrapper,
        _renderHook,
        result,
        _args11 = arguments;

      return _regenerator.default.wrap(function _callee11$(_context11) {
        while (1) {
          switch ((_context11.prev = _context11.next)) {
            case 0:
              message =
                _args11.length > 0 && _args11[0] !== undefined
                  ? _args11[0]
                  : (0, _mockBuilders.generateMessage)();
              notificationOpts = _args11.length > 1 ? _args11[1] : undefined;
              channelContextValue = _args11.length > 2 ? _args11[2] : undefined;
              _context11.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context11.sent;
              client.muteUser = muteUser;
              client.unmuteUser = unmuteUser;
              channel = (0, _mockBuilders.generateChannel)();

              wrapper = function wrapper(_ref11) {
                var children = _ref11.children;
                return /*#__PURE__*/ _react.default.createElement(
                  _context12.ChannelContext.Provider,
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
                  return (0, _useMuteHandler.useMuteHandler)(
                    message,
                    notificationOpts,
                  );
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook.result);
              return _context11.abrupt('return', result.current);

            case 12:
            case 'end':
              return _context11.stop();
          }
        }
      }, _callee11);
    }),
  );
  return _renderUseHandleMuteHook.apply(this, arguments);
}

describe('useHandleMute custom hook', function () {
  afterEach(jest.clearAllMocks);
  it(
    'should generate function that handles mutes',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var handleMute;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderUseHandleMuteHook();

              case 2:
                handleMute = _context.sent;
                expect(typeof handleMute).toBe('function');

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
        var consoleWarnSpy, handleMute;
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
                return renderUseHandleMuteHook(undefined);

              case 3:
                handleMute = _context2.sent;
                _context2.next = 6;
                return handleMute(mouseEventMock);

              case 6:
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                  _useMuteHandler.missingUseMuteHandlerParamsWarning,
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
    'should allow to mute a user and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var message,
          notify,
          userMutedNotification,
          getMuteUserSuccessNotification,
          handleMute;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                userMutedNotification = 'User muted!';
                getMuteUserSuccessNotification = jest.fn(function () {
                  return userMutedNotification;
                });
                _context3.next = 6;
                return renderUseHandleMuteHook(message, {
                  notify,
                  getSuccessNotification: getMuteUserSuccessNotification,
                });

              case 6:
                handleMute = _context3.sent;
                _context3.next = 9;
                return handleMute(mouseEventMock);

              case 9:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  userMutedNotification,
                  'success',
                );

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var message, defaultSuccessMessage, notify, handleMute;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                }); // The key for the default success message, defined in the implementation

                defaultSuccessMessage = '{{ user }} has been muted';
                notify = jest.fn();
                _context4.next = 5;
                return renderUseHandleMuteHook(message, {
                  notify,
                });

              case 5:
                handleMute = _context4.sent;
                _context4.next = 8;
                return handleMute(mouseEventMock);

              case 8:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultSuccessMessage,
                  'success',
                );

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with custom error message when muting a user fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var message,
          notify,
          userMutedFailNotification,
          getErrorNotification,
          handleMute;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                muteUser.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                userMutedFailNotification = 'User mute failed!';
                getErrorNotification = jest.fn(function () {
                  return userMutedFailNotification;
                });
                _context5.next = 7;
                return renderUseHandleMuteHook(message, {
                  notify,
                  getErrorNotification,
                });

              case 7:
                handleMute = _context5.sent;
                _context5.next = 10;
                return handleMute(mouseEventMock);

              case 10:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  userMutedFailNotification,
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
    'should allow to mute a user and notify with default error message when muting a user fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message, notify, defaultFailNotification, handleMute;
        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                muteUser.mockImplementationOnce(function () {
                  return Promise.reject();
                }); // Defined in the implementation

                defaultFailNotification = 'Error muting a user ...';
                _context6.next = 6;
                return renderUseHandleMuteHook(message, {
                  notify,
                });

              case 6:
                handleMute = _context6.sent;
                _context6.next = 9;
                return handleMute(mouseEventMock);

              case 9:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultFailNotification,
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
  it(
    'should allow to unmute a user and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var message,
          notify,
          userUnmutedNotification,
          getSuccessNotification,
          handleMute;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                unmuteUser.mockImplementationOnce(function () {
                  return Promise.resolve();
                });
                userUnmutedNotification = 'User unmuted!';
                getSuccessNotification = jest.fn(function () {
                  return userUnmutedNotification;
                });
                _context7.next = 7;
                return renderUseHandleMuteHook(
                  message,
                  {
                    notify,
                    getSuccessNotification,
                  },
                  {
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 7:
                handleMute = _context7.sent;
                _context7.next = 10;
                return handleMute(mouseEventMock);

              case 10:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  userUnmutedNotification,
                  'success',
                );

              case 12:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var message, notify, defaultSuccessNotification, handleMute;
        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                unmuteUser.mockImplementationOnce(function () {
                  return Promise.resolve();
                }); // Defined in the implementation

                defaultSuccessNotification = '{{ user }} has been unmuted';
                _context8.next = 6;
                return renderUseHandleMuteHook(
                  message,
                  {
                    notify,
                  },
                  {
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 6:
                handleMute = _context8.sent;
                _context8.next = 9;
                return handleMute(mouseEventMock);

              case 9:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultSuccessNotification,
                  'success',
                );

              case 11:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with custom error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message,
          notify,
          userMutedFailNotification,
          getErrorNotification,
          handleMute;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                unmuteUser.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                userMutedFailNotification = 'User muted failed!';
                getErrorNotification = jest.fn(function () {
                  return userMutedFailNotification;
                });
                _context9.next = 7;
                return renderUseHandleMuteHook(
                  message,
                  {
                    notify,
                    getErrorNotification,
                  },
                  {
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 7:
                handleMute = _context9.sent;
                _context9.next = 10;
                return handleMute(mouseEventMock);

              case 10:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  userMutedFailNotification,
                  'error',
                );

              case 12:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with default error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message, notify, defaultFailNotification, handleMute;
        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                notify = jest.fn();
                unmuteUser.mockImplementationOnce(function () {
                  return Promise.reject();
                }); // Defined in the implementation

                defaultFailNotification = 'Error unmuting a user ...';
                _context10.next = 6;
                return renderUseHandleMuteHook(
                  message,
                  {
                    notify,
                  },
                  {
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 6:
                handleMute = _context10.sent;
                _context10.next = 9;
                return handleMute(mouseEventMock);

              case 9:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(notify).toHaveBeenCalledWith(
                  defaultFailNotification,
                  'error',
                );

              case 11:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
});
