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

var _context8 = require('../../../../context');

var _useUserRole = require('../useUserRole');

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

var getConfig = jest.fn();
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});

function renderUserRoleHook() {
  return _renderUserRoleHook.apply(this, arguments);
}

function _renderUserRoleHook() {
  _renderUserRoleHook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
      var message,
        channelProps,
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
              channelProps = _args7.length > 1 ? _args7[1] : undefined;
              channelContextValue = _args7.length > 2 ? _args7[2] : undefined;
              _context7.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context7.sent;
              channel = (0, _mockBuilders.generateChannel)(
                _objectSpread(
                  {
                    getConfig,
                  },
                  channelProps,
                ),
              );

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
                  return (0, _useUserRole.useUserRole)(message);
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook.result);
              return _context7.abrupt('return', result.current);

            case 10:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7);
    }),
  );
  return _renderUserRoleHook.apply(this, arguments);
}

describe('useUserRole custom hook', function () {
  afterEach(jest.clearAllMocks);
  it.each([
    ['belongs', alice, true],
    ['does not belong', bob, false],
  ])(
    'should tell when the message %s to user',
    /*#__PURE__*/ (function () {
      var _ref = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee(
          _,
          user,
          expected,
        ) {
          var message, _yield$renderUserRole, isMyMessage;

          return _regenerator.default.wrap(function _callee$(_context) {
            while (1) {
              switch ((_context.prev = _context.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)({
                    user,
                  });
                  _context.next = 3;
                  return renderUserRoleHook(message);

                case 3:
                  _yield$renderUserRole = _context.sent;
                  isMyMessage = _yield$renderUserRole.isMyMessage;
                  expect(isMyMessage).toBe(expected);

                case 6:
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
    })(),
  );
  it.each([
    ['admin', true],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', false],
  ])(
    'should tell if user is admin when user has %s role',
    /*#__PURE__*/ (function () {
      var _ref2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee2(
          role,
          expected,
        ) {
          var message, adminUser, clientMock, _yield$renderUserRole2, isAdmin;

          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch ((_context2.prev = _context2.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)();
                  adminUser = (0, _mockBuilders.generateUser)({
                    role,
                  });
                  _context2.next = 4;
                  return (0, _mockBuilders.getTestClientWithUser)(adminUser);

                case 4:
                  clientMock = _context2.sent;
                  _context2.next = 7;
                  return renderUserRoleHook(
                    message,
                    {},
                    {
                      client: clientMock,
                    },
                  );

                case 7:
                  _yield$renderUserRole2 = _context2.sent;
                  isAdmin = _yield$renderUserRole2.isAdmin;
                  expect(isAdmin).toBe(expected);

                case 10:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2);
        }),
      );

      return function (_x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    })(),
  );
  it.each([
    ['admin', true],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', false],
  ])(
    'should tell if user is admin when channel state membership is set to %s',
    /*#__PURE__*/ (function () {
      var _ref3 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee3(
          role,
          expected,
        ) {
          var message, _yield$renderUserRole3, isAdmin;

          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch ((_context3.prev = _context3.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)();
                  _context3.next = 3;
                  return renderUserRoleHook(message, {
                    state: {
                      membership: {
                        role,
                      },
                    },
                  });

                case 3:
                  _yield$renderUserRole3 = _context3.sent;
                  isAdmin = _yield$renderUserRole3.isAdmin;
                  expect(isAdmin).toBe(expected);

                case 6:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3);
        }),
      );

      return function (_x6, _x7) {
        return _ref3.apply(this, arguments);
      };
    })(),
  );
  it.each([
    ['admin', false],
    ['member', false],
    ['moderator', false],
    ['channel_moderator', false],
    ['owner', true],
  ])(
    'should tell if user is owner when channel state membership is set to %s',
    /*#__PURE__*/ (function () {
      var _ref4 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee4(
          role,
          expected,
        ) {
          var message, _yield$renderUserRole4, isOwner;

          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch ((_context4.prev = _context4.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)();
                  _context4.next = 3;
                  return renderUserRoleHook(message, {
                    state: {
                      membership: {
                        role,
                      },
                    },
                  });

                case 3:
                  _yield$renderUserRole4 = _context4.sent;
                  isOwner = _yield$renderUserRole4.isOwner;
                  expect(isOwner).toBe(expected);

                case 6:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4);
        }),
      );

      return function (_x8, _x9) {
        return _ref4.apply(this, arguments);
      };
    })(),
  );
  it.each([
    ['admin', false],
    ['member', false],
    ['moderator', true],
    ['channel_moderator', true],
    ['owner', false],
  ])(
    'should tell if user is moderator when channel state membership is set to %s',
    /*#__PURE__*/ (function () {
      var _ref5 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee5(
          role,
          expected,
        ) {
          var message, _yield$renderUserRole5, isModerator;

          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)();
                  _context5.next = 3;
                  return renderUserRoleHook(message, {
                    state: {
                      membership: {
                        role,
                      },
                    },
                  });

                case 3:
                  _yield$renderUserRole5 = _context5.sent;
                  isModerator = _yield$renderUserRole5.isModerator;
                  expect(isModerator).toBe(expected);

                case 6:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5);
        }),
      );

      return function (_x10, _x11) {
        return _ref5.apply(this, arguments);
      };
    })(),
  );
  it.each([
    ['member', false],
    ['admin', true],
    ['moderator', true],
    ['channel_moderator', true],
    ['owner', true],
  ])(
    'should allow user to edit or delete message if user role is %s',
    /*#__PURE__*/ (function () {
      var _ref6 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee6(
          role,
          expected,
        ) {
          var message, _yield$renderUserRole6, canDeleteMessage, canEditMessage;

          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)();
                  _context6.next = 3;
                  return renderUserRoleHook(message, {
                    state: {
                      membership: {
                        role,
                      },
                    },
                  });

                case 3:
                  _yield$renderUserRole6 = _context6.sent;
                  canDeleteMessage = _yield$renderUserRole6.canDeleteMessage;
                  canEditMessage = _yield$renderUserRole6.canEditMessage;
                  expect(canEditMessage).toBe(expected);
                  expect(canDeleteMessage).toBe(expected);

                case 8:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6);
        }),
      );

      return function (_x12, _x13) {
        return _ref6.apply(this, arguments);
      };
    })(),
  );
});
