'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

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

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _context48 = require('../../../context');

var _utils = require('../utils');

var _Message = _interopRequireDefault(require('../Message'));

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
  image: 'alice-avatar.jpg',
  id: 'alice',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
  image: 'bob-avatar.jpg',
});
var CustomMessageUIComponent = jest.fn(function () {
  return /*#__PURE__*/ _react.default.createElement('div', null, 'Message');
});
var sendAction = jest.fn();
var sendReaction = jest.fn();
var deleteReaction = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderComponent(_x) {
  return _renderComponent.apply(this, arguments);
}

function _renderComponent() {
  _renderComponent = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee47(message) {
      var props,
        channelOpts,
        channelConfig,
        renderer,
        channel,
        client,
        _args47 = arguments;
      return _regenerator.default.wrap(function _callee47$(_context47) {
        while (1) {
          switch ((_context47.prev = _context47.next)) {
            case 0:
              props =
                _args47.length > 1 && _args47[1] !== undefined
                  ? _args47[1]
                  : {};
              channelOpts = _args47.length > 2 ? _args47[2] : undefined;
              channelConfig =
                _args47.length > 3 && _args47[3] !== undefined
                  ? _args47[3]
                  : {
                      replies: true,
                    };
              renderer =
                _args47.length > 4 && _args47[4] !== undefined
                  ? _args47[4]
                  : _react2.render;
              channel = (0, _mockBuilders.generateChannel)(
                _objectSpread(
                  {
                    getConfig: function getConfig() {
                      return channelConfig;
                    },
                    sendAction,
                    sendReaction,
                    deleteReaction,
                  },
                  channelOpts,
                ),
              );
              _context47.next = 7;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 7:
              client = _context47.sent;
              return _context47.abrupt(
                'return',
                renderer(
                  /*#__PURE__*/ _react.default.createElement(
                    _context48.ChannelContext.Provider,
                    {
                      value: _objectSpread(
                        {
                          client,
                          channel,
                          updateMessage: jest.fn(),
                          removeMessage: jest.fn(),
                          openThread: jest.fn(),
                        },
                        channelOpts,
                      ),
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context48.TranslationContext.Provider,
                      {
                        value: {
                          t: function t(key) {
                            return key;
                          },
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _Message.default,
                        (0, _extends2.default)(
                          {
                            message: message,
                            typing: false,
                            Message: CustomMessageUIComponent,
                          },
                          props,
                        ),
                      ),
                    ),
                  ),
                ),
              );

            case 9:
            case 'end':
              return _context47.stop();
          }
        }
      }, _callee47);
    }),
  );
  return _renderComponent.apply(this, arguments);
}

function renderComponentWithMessage() {
  var props =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var channelOpts =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var channelConfig =
    arguments.length > 2 && arguments[2] !== undefined
      ? arguments[2]
      : {
          replies: true,
        };
  var message = (0, _mockBuilders.generateMessage)();
  return renderComponent(message, props, channelOpts, channelConfig);
}

function getRenderedProps() {
  return CustomMessageUIComponent.mock.calls[0][0];
}

describe('<Message /> component', function () {
  beforeEach(jest.clearAllMocks);
  afterEach(_react2.cleanup);
  it(
    'should pass custom props to its Message child component',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderComponentWithMessage({
                  customProp: 'some custom prop',
                });

              case 2:
                expect(CustomMessageUIComponent).toHaveBeenCalledWith(
                  expect.objectContaining({
                    customProp: 'some custom prop',
                  }),
                  {},
                );

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should enable actions if message is of type regular and status received',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var message;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  type: 'regular',
                  status: 'received',
                });
                _context2.next = 3;
                return renderComponent(message);

              case 3:
                expect(CustomMessageUIComponent).toHaveBeenCalledWith(
                  expect.objectContaining({
                    actionsEnabled: true,
                  }),
                  {},
                );

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    "should warn if message's own reactions contain a reaction from a different user then the currently active one",
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var reaction, message, _getRenderedProps, handleReaction;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                reaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = (0, _mockBuilders.generateMessage)({
                  own_reactions: [reaction],
                });
                jest.spyOn(console, 'warn').mockImplementationOnce(function () {
                  return null;
                });
                _context3.next = 5;
                return renderComponent(message);

              case 5:
                (_getRenderedProps = getRenderedProps()),
                  (handleReaction = _getRenderedProps.handleReaction);
                handleReaction();
                expect(console.warn).toHaveBeenCalledTimes(1);

              case 8:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should delete own reaction from channel if it was already there',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var reaction, message, _getRenderedProps2, handleReaction;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                reaction = (0, _mockBuilders.generateReaction)({
                  user: alice,
                });
                message = (0, _mockBuilders.generateMessage)({
                  own_reactions: [reaction],
                });
                _context4.next = 4;
                return renderComponent(message);

              case 4:
                (_getRenderedProps2 = getRenderedProps()),
                  (handleReaction = _getRenderedProps2.handleReaction);
                _context4.next = 7;
                return handleReaction(reaction.type);

              case 7:
                expect(deleteReaction).toHaveBeenCalledWith(
                  message.id,
                  reaction.type,
                );

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should send reaction',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var reaction, message, _getRenderedProps3, handleReaction;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                reaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = (0, _mockBuilders.generateMessage)({
                  own_reactions: [],
                });
                _context5.next = 4;
                return renderComponent(message);

              case 4:
                (_getRenderedProps3 = getRenderedProps()),
                  (handleReaction = _getRenderedProps3.handleReaction);
                _context5.next = 7;
                return handleReaction(reaction.type);

              case 7:
                expect(sendReaction).toHaveBeenCalledWith(message.id, {
                  type: reaction.type,
                });

              case 8:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should rollback reaction if channel update fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var reaction,
          message,
          updateMessage,
          _getRenderedProps4,
          handleReaction;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                reaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = (0, _mockBuilders.generateMessage)({
                  own_reactions: [],
                });
                updateMessage = jest.fn();
                _context6.next = 5;
                return renderComponent(
                  message,
                  {},
                  {
                    updateMessage,
                  },
                );

              case 5:
                (_getRenderedProps4 = getRenderedProps()),
                  (handleReaction = _getRenderedProps4.handleReaction);
                sendReaction.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                _context6.next = 9;
                return handleReaction(reaction.type);

              case 9:
                expect(updateMessage).toHaveBeenCalledWith(message);

              case 10:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should update message after an action',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var updateMessage,
          currentMessage,
          updatedMessage,
          action,
          _getRenderedProps5,
          handleAction;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                updateMessage = jest.fn();
                currentMessage = (0, _mockBuilders.generateMessage)();
                updatedMessage = (0, _mockBuilders.generateMessage)();
                action = {
                  name: 'action',
                  value: 'value',
                };
                sendAction.mockImplementationOnce(function () {
                  return Promise.resolve({
                    message: updatedMessage,
                  });
                });
                _context7.next = 7;
                return renderComponent(
                  currentMessage,
                  {},
                  {
                    updateMessage,
                  },
                );

              case 7:
                (_getRenderedProps5 = getRenderedProps()),
                  (handleAction = _getRenderedProps5.handleAction);
                _context7.next = 10;
                return handleAction(action.name, action.value, mouseEventMock);

              case 10:
                expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
                  [action.name]: action.value,
                });
                expect(updateMessage).toHaveBeenCalledWith(updatedMessage);

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
    'should fallback to original message after an action fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var removeMessage,
          currentMessage,
          action,
          _getRenderedProps6,
          handleAction;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                removeMessage = jest.fn();
                currentMessage = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                action = {
                  name: 'action',
                  value: 'value',
                };
                sendAction.mockImplementationOnce(function () {
                  return Promise.resolve(undefined);
                });
                _context8.next = 6;
                return renderComponent(
                  currentMessage,
                  {},
                  {
                    removeMessage,
                  },
                );

              case 6:
                (_getRenderedProps6 = getRenderedProps()),
                  (handleAction = _getRenderedProps6.handleAction);
                _context8.next = 9;
                return handleAction(action.name, action.value, mouseEventMock);

              case 9:
                expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
                  [action.name]: action.value,
                });
                expect(removeMessage).toHaveBeenCalledWith(currentMessage);

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
    'should handle retry',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message, retrySendMessage, _getRenderedProps7, handleRetry;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                retrySendMessage = jest.fn(function () {
                  return Promise.resolve();
                });
                _context9.next = 4;
                return renderComponent(
                  message,
                  {},
                  {
                    retrySendMessage,
                  },
                );

              case 4:
                (_getRenderedProps7 = getRenderedProps()),
                  (handleRetry = _getRenderedProps7.handleRetry);
                _context9.next = 7;
                return handleRetry(message);

              case 7:
                expect(retrySendMessage).toHaveBeenCalledWith(message);

              case 8:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should trigger channel mentions handler when there is one set and user clicks on a mention',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message,
          onMentionsClick,
          _getRenderedProps8,
          onMentionsClickMessage;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  mentioned_users: [bob],
                });
                onMentionsClick = jest.fn(function () {});
                _context10.next = 4;
                return renderComponent(
                  message,
                  {},
                  {
                    onMentionsClick,
                  },
                );

              case 4:
                (_getRenderedProps8 = getRenderedProps()),
                  (onMentionsClickMessage =
                    _getRenderedProps8.onMentionsClickMessage);
                onMentionsClickMessage(mouseEventMock);
                expect(onMentionsClick).toHaveBeenCalledWith(
                  mouseEventMock,
                  message.mentioned_users,
                );

              case 7:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it(
    'should trigger channel mentions hover on mentions hover',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var message,
          onMentionsHover,
          _getRenderedProps9,
          onMentionsHoverMessage;

        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  mentioned_users: [bob],
                });
                onMentionsHover = jest.fn(function () {});
                _context11.next = 4;
                return renderComponent(
                  message,
                  {},
                  {
                    onMentionsHover,
                  },
                );

              case 4:
                (_getRenderedProps9 = getRenderedProps()),
                  (onMentionsHoverMessage =
                    _getRenderedProps9.onMentionsHoverMessage);
                onMentionsHoverMessage(mouseEventMock);
                expect(onMentionsHover).toHaveBeenCalledWith(
                  mouseEventMock,
                  message.mentioned_users,
                );

              case 7:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11);
      }),
    ),
  );
  it(
    'should trigger channel onUserClick handler when a user element is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var message, onUserClickMock, _getRenderedProps10, onUserClick;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                onUserClickMock = jest.fn(function () {});
                _context12.next = 4;
                return renderComponent(message, {
                  onUserClick: onUserClickMock,
                });

              case 4:
                (_getRenderedProps10 = getRenderedProps()),
                  (onUserClick = _getRenderedProps10.onUserClick);
                onUserClick(mouseEventMock);
                expect(onUserClickMock).toHaveBeenCalledWith(
                  mouseEventMock,
                  message.user,
                );

              case 7:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12);
      }),
    ),
  );
  it(
    'should trigger channel onUserHover handler when a user element is hovered',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var message, onUserHoverMock, _getRenderedProps11, onUserHover;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                onUserHoverMock = jest.fn(function () {});
                _context13.next = 4;
                return renderComponent(message, {
                  onUserHover: onUserHoverMock,
                });

              case 4:
                (_getRenderedProps11 = getRenderedProps()),
                  (onUserHover = _getRenderedProps11.onUserHover);
                onUserHover(mouseEventMock);
                expect(onUserHoverMock).toHaveBeenCalledWith(
                  mouseEventMock,
                  message.user,
                );

              case 7:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
        var message,
          client,
          addNotification,
          muteUser,
          userMutedNotification,
          getMuteUserSuccessNotification,
          _getRenderedProps12,
          handleMute;

        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch ((_context14.prev = _context14.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context14.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context14.sent;
                addNotification = jest.fn();
                muteUser = jest.fn(function () {
                  return Promise.resolve();
                });
                userMutedNotification = 'User muted!';
                getMuteUserSuccessNotification = jest.fn(function () {
                  return userMutedNotification;
                });
                client.muteUser = muteUser;
                _context14.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getMuteUserSuccessNotification,
                  },
                  {
                    client,
                    mutes: [],
                  },
                );

              case 11:
                (_getRenderedProps12 = getRenderedProps()),
                  (handleMute = _getRenderedProps12.handleMute);
                _context14.next = 14;
                return handleMute(mouseEventMock);

              case 14:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  userMutedNotification,
                  'success',
                );

              case 16:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
        var message,
          defaultSuccessMessage,
          client,
          addNotification,
          muteUser,
          _getRenderedProps13,
          handleMute;

        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch ((_context15.prev = _context15.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                defaultSuccessMessage = '{{ user }} has been muted';
                _context15.next = 4;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 4:
                client = _context15.sent;
                addNotification = jest.fn();
                muteUser = jest.fn(function () {
                  return Promise.resolve();
                });
                client.muteUser = muteUser;
                _context15.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                    mutes: [],
                  },
                );

              case 10:
                (_getRenderedProps13 = getRenderedProps()),
                  (handleMute = _getRenderedProps13.handleMute);
                _context15.next = 13;
                return handleMute(mouseEventMock);

              case 13:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultSuccessMessage,
                  'success',
                );

              case 15:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with custom error message when muting a user fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
        var message,
          client,
          addNotification,
          muteUser,
          userMutedFailNotification,
          getMuteUserErrorNotification,
          _getRenderedProps14,
          handleMute;

        return _regenerator.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch ((_context16.prev = _context16.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context16.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context16.sent;
                addNotification = jest.fn();
                muteUser = jest.fn(function () {
                  return Promise.reject();
                });
                userMutedFailNotification = 'User mute failed!';
                getMuteUserErrorNotification = jest.fn(function () {
                  return userMutedFailNotification;
                });
                client.muteUser = muteUser;
                _context16.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getMuteUserErrorNotification,
                  },
                  {
                    client,
                    mutes: [],
                  },
                );

              case 11:
                (_getRenderedProps14 = getRenderedProps()),
                  (handleMute = _getRenderedProps14.handleMute);
                _context16.next = 14;
                return handleMute(mouseEventMock);

              case 14:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  userMutedFailNotification,
                  'error',
                );

              case 16:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16);
      }),
    ),
  );
  it(
    'should allow to mute a user and notify with default error message when muting a user fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
        var message,
          client,
          addNotification,
          muteUser,
          defaultFailNotification,
          _getRenderedProps15,
          handleMute;

        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch ((_context17.prev = _context17.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context17.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context17.sent;
                addNotification = jest.fn();
                muteUser = jest.fn(function () {
                  return Promise.reject();
                });
                defaultFailNotification = 'Error muting a user ...';
                client.muteUser = muteUser;
                _context17.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                    mutes: [],
                  },
                );

              case 10:
                (_getRenderedProps15 = getRenderedProps()),
                  (handleMute = _getRenderedProps15.handleMute);
                _context17.next = 13;
                return handleMute(mouseEventMock);

              case 13:
                expect(muteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultFailNotification,
                  'error',
                );

              case 15:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
        var message,
          client,
          addNotification,
          unmuteUser,
          userUnmutedNotification,
          getMuteUserSuccessNotification,
          _getRenderedProps16,
          handleMute;

        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch ((_context18.prev = _context18.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context18.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context18.sent;
                addNotification = jest.fn();
                unmuteUser = jest.fn(function () {
                  return Promise.resolve();
                });
                userUnmutedNotification = 'User unmuted!';
                getMuteUserSuccessNotification = jest.fn(function () {
                  return userUnmutedNotification;
                });
                client.unmuteUser = unmuteUser;
                _context18.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getMuteUserSuccessNotification,
                  },
                  {
                    client,
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 11:
                (_getRenderedProps16 = getRenderedProps()),
                  (handleMute = _getRenderedProps16.handleMute);
                _context18.next = 14;
                return handleMute(mouseEventMock);

              case 14:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  userUnmutedNotification,
                  'success',
                );

              case 16:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
        var message,
          client,
          addNotification,
          unmuteUser,
          defaultSuccessNotification,
          _getRenderedProps17,
          handleMute;

        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch ((_context19.prev = _context19.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context19.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context19.sent;
                addNotification = jest.fn();
                unmuteUser = jest.fn(function () {
                  return Promise.resolve();
                });
                defaultSuccessNotification = '{{ user }} has been unmuted';
                client.unmuteUser = unmuteUser;
                _context19.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 10:
                (_getRenderedProps17 = getRenderedProps()),
                  (handleMute = _getRenderedProps17.handleMute);
                _context19.next = 13;
                return handleMute(mouseEventMock);

              case 13:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultSuccessNotification,
                  'success',
                );

              case 15:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with custom error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
        var message,
          client,
          addNotification,
          unmuteUser,
          userMutedFailNotification,
          getMuteUserErrorNotification,
          _getRenderedProps18,
          handleMute;

        return _regenerator.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch ((_context20.prev = _context20.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context20.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context20.sent;
                addNotification = jest.fn();
                unmuteUser = jest.fn(function () {
                  return Promise.reject();
                });
                userMutedFailNotification = 'User muted failed!';
                getMuteUserErrorNotification = jest.fn(function () {
                  return userMutedFailNotification;
                });
                client.unmuteUser = unmuteUser;
                _context20.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getMuteUserErrorNotification,
                  },
                  {
                    client,
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 11:
                (_getRenderedProps18 = getRenderedProps()),
                  (handleMute = _getRenderedProps18.handleMute);
                _context20.next = 14;
                return handleMute(mouseEventMock);

              case 14:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  userMutedFailNotification,
                  'error',
                );

              case 16:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20);
      }),
    ),
  );
  it(
    'should allow to unmute a user and notify with default error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
        var message,
          client,
          addNotification,
          unmuteUser,
          defaultFailNotification,
          _getRenderedProps19,
          handleMute;

        return _regenerator.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch ((_context21.prev = _context21.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context21.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context21.sent;
                addNotification = jest.fn();
                unmuteUser = jest.fn(function () {
                  return Promise.reject();
                });
                defaultFailNotification = 'Error unmuting a user ...';
                client.unmuteUser = unmuteUser;
                _context21.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                    mutes: [
                      {
                        target: {
                          id: bob.id,
                        },
                      },
                    ],
                  },
                );

              case 10:
                (_getRenderedProps19 = getRenderedProps()),
                  (handleMute = _getRenderedProps19.handleMute);
                _context21.next = 13;
                return handleMute(mouseEventMock);

              case 13:
                expect(unmuteUser).toHaveBeenCalledWith(bob.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultFailNotification,
                  'error',
                );

              case 15:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21);
      }),
    ),
  );
  it.each([
    ['empty', []],
    ['false', false],
  ])(
    'should return no message actions to UI component if message actions are %s',
    /*#__PURE__*/ (function () {
      var _ref22 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee22(
          _,
          actionsValue,
        ) {
          var message, messageActions, _getRenderedProps20, getMessageActions;

          return _regenerator.default.wrap(function _callee22$(_context22) {
            while (1) {
              switch ((_context22.prev = _context22.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)({
                    user: bob,
                  });
                  messageActions = actionsValue;
                  _context22.next = 4;
                  return renderComponent(message, {
                    messageActions,
                  });

                case 4:
                  (_getRenderedProps20 = getRenderedProps()),
                    (getMessageActions = _getRenderedProps20.getMessageActions);
                  expect(getMessageActions()).toStrictEqual([]);

                case 6:
                case 'end':
                  return _context22.stop();
              }
            }
          }, _callee22);
        }),
      );

      return function (_x2, _x3) {
        return _ref22.apply(this, arguments);
      };
    })(),
  );
  it(
    'should allow user to edit and delete message when message is from the user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee23() {
        var message, _getRenderedProps21, getMessageActions;

        return _regenerator.default.wrap(function _callee23$(_context23) {
          while (1) {
            switch ((_context23.prev = _context23.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                _context23.next = 3;
                return renderComponent(message);

              case 3:
                (_getRenderedProps21 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps21.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.edit,
                );
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.delete,
                );

              case 6:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23);
      }),
    ),
  );
  it.each([
    ['moderator', 'moderator'],
    ['channel moderator', 'channel_moderator'],
  ])(
    'should allow user to edit and delete message when user is %s',
    /*#__PURE__*/ (function () {
      var _ref24 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee24(_, role) {
          var message, _getRenderedProps22, getMessageActions;

          return _regenerator.default.wrap(function _callee24$(_context24) {
            while (1) {
              switch ((_context24.prev = _context24.next)) {
                case 0:
                  message = (0, _mockBuilders.generateMessage)({
                    user: bob,
                  });
                  _context24.next = 3;
                  return renderComponent(
                    message,
                    {},
                    {
                      state: {
                        membership: {
                          role,
                        },
                        members: {},
                        watchers: {},
                      },
                    },
                  );

                case 3:
                  (_getRenderedProps22 = getRenderedProps()),
                    (getMessageActions = _getRenderedProps22.getMessageActions);
                  expect(getMessageActions()).toContain(
                    _utils.MESSAGE_ACTIONS.edit,
                  );
                  expect(getMessageActions()).toContain(
                    _utils.MESSAGE_ACTIONS.delete,
                  );

                case 6:
                case 'end':
                  return _context24.stop();
              }
            }
          }, _callee24);
        }),
      );

      return function (_x4, _x5) {
        return _ref24.apply(this, arguments);
      };
    })(),
  );
  it(
    'should allow user to edit and delete message when user is owner',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
        var message, _getRenderedProps23, getMessageActions;

        return _regenerator.default.wrap(function _callee25$(_context25) {
          while (1) {
            switch ((_context25.prev = _context25.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context25.next = 3;
                return renderComponent(
                  message,
                  {},
                  {
                    state: {
                      membership: {
                        role: 'owner',
                      },
                      members: {},
                      watchers: {},
                    },
                  },
                );

              case 3:
                (_getRenderedProps23 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps23.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.edit,
                );
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.delete,
                );

              case 6:
              case 'end':
                return _context25.stop();
            }
          }
        }, _callee25);
      }),
    ),
  );
  it(
    'should allow user to edit and delete message when moderator role is set on client',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
        var amin, client, message, _getRenderedProps24, getMessageActions;

        return _regenerator.default.wrap(function _callee26$(_context26) {
          while (1) {
            switch ((_context26.prev = _context26.next)) {
              case 0:
                amin = (0, _mockBuilders.generateUser)({
                  name: 'amin',
                  role: 'channel_moderator',
                });
                _context26.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(amin);

              case 3:
                client = _context26.sent;
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context26.next = 7;
                return renderComponent(
                  message,
                  {},
                  {
                    client,
                  },
                );

              case 7:
                (_getRenderedProps24 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps24.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.edit,
                );
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.delete,
                );

              case 10:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26);
      }),
    ),
  );
  it(
    'should allow user to edit and delete message when user is admin',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
        var message, _getRenderedProps25, getMessageActions;

        return _regenerator.default.wrap(function _callee27$(_context27) {
          while (1) {
            switch ((_context27.prev = _context27.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context27.next = 3;
                return renderComponent(
                  message,
                  {},
                  {
                    state: {
                      membership: {
                        role: 'admin',
                      },
                      members: {},
                      watchers: {},
                    },
                  },
                );

              case 3:
                (_getRenderedProps25 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps25.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.edit,
                );
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.delete,
                );

              case 6:
              case 'end':
                return _context27.stop();
            }
          }
        }, _callee27);
      }),
    ),
  );
  it(
    'should not allow user to edit or delete message when user message is not from user and user has no special role',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
        var message, _getRenderedProps26, getMessageActions;

        return _regenerator.default.wrap(function _callee28$(_context28) {
          while (1) {
            switch ((_context28.prev = _context28.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context28.next = 3;
                return renderComponent(message);

              case 3:
                (_getRenderedProps26 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps26.getMessageActions);
                expect(getMessageActions()).not.toContain(
                  _utils.MESSAGE_ACTIONS.edit,
                );
                expect(getMessageActions()).not.toContain(
                  _utils.MESSAGE_ACTIONS.delete,
                );

              case 6:
              case 'end':
                return _context28.stop();
            }
          }
        }, _callee28);
      }),
    ),
  );
  it(
    'should allow user to flag others messages',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
        var message, _getRenderedProps27, getMessageActions;

        return _regenerator.default.wrap(function _callee29$(_context29) {
          while (1) {
            switch ((_context29.prev = _context29.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context29.next = 3;
                return renderComponent(message);

              case 3:
                (_getRenderedProps27 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps27.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.flag,
                );

              case 5:
              case 'end':
                return _context29.stop();
            }
          }
        }, _callee29);
      }),
    ),
  );
  it(
    'should allow user to mute others messages',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee30() {
        var message, _getRenderedProps28, getMessageActions;

        return _regenerator.default.wrap(function _callee30$(_context30) {
          while (1) {
            switch ((_context30.prev = _context30.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context30.next = 3;
                return renderComponent(
                  message,
                  {},
                  {},
                  {
                    mutes: true,
                  },
                );

              case 3:
                (_getRenderedProps28 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps28.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.mute,
                );

              case 5:
              case 'end':
                return _context30.stop();
            }
          }
        }, _callee30);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with custom success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee31() {
        var message,
          client,
          addNotification,
          flagMessage,
          messageFlaggedNotification,
          getFlagMessageSuccessNotification,
          _getRenderedProps29,
          handleFlag;

        return _regenerator.default.wrap(function _callee31$(_context31) {
          while (1) {
            switch ((_context31.prev = _context31.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                _context31.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context31.sent;
                addNotification = jest.fn();
                flagMessage = jest.fn(function () {
                  return Promise.resolve();
                });
                client.flagMessage = flagMessage;
                messageFlaggedNotification = 'Message flagged!';
                getFlagMessageSuccessNotification = jest.fn(function () {
                  return messageFlaggedNotification;
                });
                _context31.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getFlagMessageSuccessNotification,
                  },
                  {
                    client,
                  },
                );

              case 11:
                (_getRenderedProps29 = getRenderedProps()),
                  (handleFlag = _getRenderedProps29.handleFlag);
                _context31.next = 14;
                return handleFlag(mouseEventMock);

              case 14:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(addNotification).toHaveBeenCalledWith(
                  messageFlaggedNotification,
                  'success',
                );

              case 16:
              case 'end':
                return _context31.stop();
            }
          }
        }, _callee31);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with default success notification when it is successful',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee32() {
        var message,
          client,
          addNotification,
          flagMessage,
          defaultSuccessNotification,
          _getRenderedProps30,
          handleFlag;

        return _regenerator.default.wrap(function _callee32$(_context32) {
          while (1) {
            switch ((_context32.prev = _context32.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                _context32.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context32.sent;
                addNotification = jest.fn();
                flagMessage = jest.fn(function () {
                  return Promise.resolve();
                });
                client.flagMessage = flagMessage;
                defaultSuccessNotification =
                  'Message has been successfully flagged';
                _context32.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                  },
                );

              case 10:
                (_getRenderedProps30 = getRenderedProps()),
                  (handleFlag = _getRenderedProps30.handleFlag);
                _context32.next = 13;
                return handleFlag(mouseEventMock);

              case 13:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultSuccessNotification,
                  'success',
                );

              case 15:
              case 'end':
                return _context32.stop();
            }
          }
        }, _callee32);
      }),
    ),
  );
  it(
    'should allow to flag a message and notify with custom error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee33() {
        var message,
          client,
          addNotification,
          flagMessage,
          messageFlagFailedNotification,
          getFlagMessageErrorNotification,
          _getRenderedProps31,
          handleFlag;

        return _regenerator.default.wrap(function _callee33$(_context33) {
          while (1) {
            switch ((_context33.prev = _context33.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                _context33.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context33.sent;
                addNotification = jest.fn();
                flagMessage = jest.fn(function () {
                  return Promise.reject();
                });
                client.flagMessage = flagMessage;
                messageFlagFailedNotification = 'Message flagged failed!';
                getFlagMessageErrorNotification = jest.fn(function () {
                  return messageFlagFailedNotification;
                });
                _context33.next = 11;
                return renderComponent(
                  message,
                  {
                    addNotification,
                    getFlagMessageErrorNotification,
                  },
                  {
                    client,
                  },
                );

              case 11:
                (_getRenderedProps31 = getRenderedProps()),
                  (handleFlag = _getRenderedProps31.handleFlag);
                _context33.next = 14;
                return handleFlag(mouseEventMock);

              case 14:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(addNotification).toHaveBeenCalledWith(
                  messageFlagFailedNotification,
                  'error',
                );

              case 16:
              case 'end':
                return _context33.stop();
            }
          }
        }, _callee33);
      }),
    ),
  );
  it(
    'should allow to flag a user and notify with default error message when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee34() {
        var message,
          client,
          addNotification,
          flagMessage,
          defaultFlagMessageFailedNotification,
          _getRenderedProps32,
          handleFlag;

        return _regenerator.default.wrap(function _callee34$(_context34) {
          while (1) {
            switch ((_context34.prev = _context34.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                _context34.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context34.sent;
                addNotification = jest.fn();
                flagMessage = jest.fn(function () {
                  return Promise.reject();
                });
                client.flagMessage = flagMessage;
                defaultFlagMessageFailedNotification =
                  'Error adding flag: Either the flag already exist or there is issue with network connection ...';
                _context34.next = 10;
                return renderComponent(
                  message,
                  {
                    addNotification,
                  },
                  {
                    client,
                  },
                );

              case 10:
                (_getRenderedProps32 = getRenderedProps()),
                  (handleFlag = _getRenderedProps32.handleFlag);
                _context34.next = 13;
                return handleFlag(mouseEventMock);

              case 13:
                expect(flagMessage).toHaveBeenCalledWith(message.id);
                expect(addNotification).toHaveBeenCalledWith(
                  defaultFlagMessageFailedNotification,
                  'error',
                );

              case 15:
              case 'end':
                return _context34.stop();
            }
          }
        }, _callee34);
      }),
    ),
  );
  it(
    'should allow user to pin messages when permissions allow',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee35() {
        var message, _getRenderedProps33, getMessageActions;

        return _regenerator.default.wrap(function _callee35$(_context35) {
          while (1) {
            switch ((_context35.prev = _context35.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context35.next = 3;
                return renderComponent(
                  message,
                  {
                    pinPermissions: {
                      messaging: {
                        user: true,
                      },
                    },
                  },
                  {
                    type: 'messaging',
                    state: {
                      members: {},
                      watchers: {},
                    },
                  },
                );

              case 3:
                (_getRenderedProps33 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps33.getMessageActions);
                expect(getMessageActions()).toContain(
                  _utils.MESSAGE_ACTIONS.pin,
                );

              case 5:
              case 'end':
                return _context35.stop();
            }
          }
        }, _callee35);
      }),
    ),
  );
  it(
    'should not allow user to pin messages when permissions do not allow',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee36() {
        var message, _getRenderedProps34, getMessageActions;

        return _regenerator.default.wrap(function _callee36$(_context36) {
          while (1) {
            switch ((_context36.prev = _context36.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: bob,
                });
                _context36.next = 3;
                return renderComponent(
                  message,
                  {
                    pinPermissions: {
                      messaging: {
                        user: false,
                      },
                    },
                  },
                  {
                    type: 'messaging',
                    state: {
                      members: {},
                      watchers: {},
                    },
                  },
                );

              case 3:
                (_getRenderedProps34 = getRenderedProps()),
                  (getMessageActions = _getRenderedProps34.getMessageActions);
                expect(getMessageActions()).not.toContain(
                  _utils.MESSAGE_ACTIONS.pin,
                );

              case 5:
              case 'end':
                return _context36.stop();
            }
          }
        }, _callee36);
      }),
    ),
  );
  it(
    'should allow user to retry sending a message',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee37() {
        var message, retrySendMessage, _getRenderedProps35, handleRetry;

        return _regenerator.default.wrap(function _callee37$(_context37) {
          while (1) {
            switch ((_context37.prev = _context37.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                retrySendMessage = jest.fn(function () {
                  return Promise.resolve();
                });
                _context37.next = 4;
                return renderComponent(
                  message,
                  {},
                  {
                    retrySendMessage,
                  },
                );

              case 4:
                (_getRenderedProps35 = getRenderedProps()),
                  (handleRetry = _getRenderedProps35.handleRetry);
                handleRetry(message);
                expect(retrySendMessage).toHaveBeenCalledWith(message);

              case 7:
              case 'end':
                return _context37.stop();
            }
          }
        }, _callee37);
      }),
    ),
  );
  it(
    'should allow user to open a thread',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee38() {
        var message, openThread, _getRenderedProps36, handleOpenThread;

        return _regenerator.default.wrap(function _callee38$(_context38) {
          while (1) {
            switch ((_context38.prev = _context38.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                openThread = jest.fn();
                _context38.next = 4;
                return renderComponent(
                  message,
                  {},
                  {
                    openThread,
                  },
                );

              case 4:
                (_getRenderedProps36 = getRenderedProps()),
                  (handleOpenThread = _getRenderedProps36.handleOpenThread);
                handleOpenThread(mouseEventMock);
                expect(openThread).toHaveBeenCalledWith(
                  message,
                  mouseEventMock,
                );

              case 7:
              case 'end':
                return _context38.stop();
            }
          }
        }, _callee38);
      }),
    ),
  );
  it(
    'should correctly tell if message belongs to currently set user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee39() {
        var message, client, _getRenderedProps37, isMyMessage;

        return _regenerator.default.wrap(function _callee39$(_context39) {
          while (1) {
            switch ((_context39.prev = _context39.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                _context39.next = 3;
                return (0, _mockBuilders.getTestClientWithUser)(alice);

              case 3:
                client = _context39.sent;
                _context39.next = 6;
                return renderComponent(message, {
                  client,
                });

              case 6:
                (_getRenderedProps37 = getRenderedProps()),
                  (isMyMessage = _getRenderedProps37.isMyMessage);
                expect(isMyMessage(message)).toBe(true);

              case 8:
              case 'end':
                return _context39.stop();
            }
          }
        }, _callee39);
      }),
    ),
  );
  it(
    'should pass channel configuration to UI rendered UI component',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee40() {
        var message, channelConfigMock, _getRenderedProps38, channelConfig;

        return _regenerator.default.wrap(function _callee40$(_context40) {
          while (1) {
            switch ((_context40.prev = _context40.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                channelConfigMock = {
                  replies: false,
                  mutes: false,
                };
                _context40.next = 4;
                return renderComponent(message, {}, {}, channelConfigMock);

              case 4:
                (_getRenderedProps38 = getRenderedProps()),
                  (channelConfig = _getRenderedProps38.channelConfig);
                expect(channelConfig).toBe(channelConfigMock);

              case 6:
              case 'end':
                return _context40.stop();
            }
          }
        }, _callee40);
      }),
    ),
  );
  it(
    'should rerender if message changes',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee41() {
        var message, UIMock, _yield$renderComponen, rerender, updatedMessage;

        return _regenerator.default.wrap(function _callee41$(_context41) {
          while (1) {
            switch ((_context41.prev = _context41.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                  text: 'Helo!',
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context41.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                });

              case 4:
                _yield$renderComponen = _context41.sent;
                rerender = _yield$renderComponen.rerender;
                updatedMessage = (0, _mockBuilders.generateMessage)({
                  user: alice,
                  text: 'Hello*',
                });
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context41.next = 11;
                return renderComponent(
                  updatedMessage,
                  {
                    Message: UIMock,
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 11:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 12:
              case 'end':
                return _context41.stop();
            }
          }
        }, _callee41);
      }),
    ),
  );
  it(
    'should rerender if readBy changes',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee42() {
        var message, UIMock, _yield$renderComponen2, rerender;

        return _regenerator.default.wrap(function _callee42$(_context42) {
          while (1) {
            switch ((_context42.prev = _context42.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context42.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                });

              case 4:
                _yield$renderComponen2 = _context42.sent;
                rerender = _yield$renderComponen2.rerender;
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context42.next = 10;
                return renderComponent(
                  message,
                  {
                    Message: UIMock,
                    readBy: [bob],
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 10:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 11:
              case 'end':
                return _context42.stop();
            }
          }
        }, _callee42);
      }),
    ),
  );
  it(
    'should rerender if groupStyles change',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee43() {
        var message, UIMock, _yield$renderComponen3, rerender;

        return _regenerator.default.wrap(function _callee43$(_context43) {
          while (1) {
            switch ((_context43.prev = _context43.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context43.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                  groupStyles: ['bottom'],
                });

              case 4:
                _yield$renderComponen3 = _context43.sent;
                rerender = _yield$renderComponen3.rerender;
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context43.next = 10;
                return renderComponent(
                  message,
                  {
                    Message: UIMock,
                    groupStyles: ['bottom', 'left'],
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 10:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 11:
              case 'end':
                return _context43.stop();
            }
          }
        }, _callee43);
      }),
    ),
  );
  it(
    'should last received id changes',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee44() {
        var message, UIMock, _yield$renderComponen4, rerender;

        return _regenerator.default.wrap(function _callee44$(_context44) {
          while (1) {
            switch ((_context44.prev = _context44.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context44.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                  lastReceivedId: 'last-received-id-1',
                });

              case 4:
                _yield$renderComponen4 = _context44.sent;
                rerender = _yield$renderComponen4.rerender;
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context44.next = 10;
                return renderComponent(
                  message,
                  {
                    Message: UIMock,
                    lastReceivedId: 'last-received-id-2',
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 10:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 11:
              case 'end':
                return _context44.stop();
            }
          }
        }, _callee44);
      }),
    ),
  );
  it(
    'should rerender if it enters edit mode',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee45() {
        var message, UIMock, _yield$renderComponen5, rerender;

        return _regenerator.default.wrap(function _callee45$(_context45) {
          while (1) {
            switch ((_context45.prev = _context45.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context45.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                  editing: false,
                });

              case 4:
                _yield$renderComponen5 = _context45.sent;
                rerender = _yield$renderComponen5.rerender;
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context45.next = 10;
                return renderComponent(
                  message,
                  {
                    Message: UIMock,
                    editing: true,
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 10:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 11:
              case 'end':
                return _context45.stop();
            }
          }
        }, _callee45);
      }),
    ),
  );
  it(
    'should rerender if message list changes position',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee46() {
        var message, UIMock, _yield$renderComponen6, rerender;

        return _regenerator.default.wrap(function _callee46$(_context46) {
          while (1) {
            switch ((_context46.prev = _context46.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  user: alice,
                });
                UIMock = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'UI mock',
                  );
                });
                _context46.next = 4;
                return renderComponent(message, {
                  Message: UIMock,
                  messageListRect: {
                    height: 100,
                    width: 100,
                    x: 10,
                    y: 10,
                  },
                });

              case 4:
                _yield$renderComponen6 = _context46.sent;
                rerender = _yield$renderComponen6.rerender;
                expect(UIMock).toHaveBeenCalledTimes(1);
                UIMock.mockClear();
                _context46.next = 10;
                return renderComponent(
                  message,
                  {
                    Message: UIMock,
                    messageListRect: {
                      height: 200,
                      width: 200,
                      x: 20,
                      y: 20,
                    },
                  },
                  undefined,
                  undefined,
                  rerender,
                );

              case 10:
                expect(UIMock).toHaveBeenCalledTimes(1);

              case 11:
              case 'end':
                return _context46.stop();
            }
          }
        }, _callee46);
      }),
    ),
  );
});
