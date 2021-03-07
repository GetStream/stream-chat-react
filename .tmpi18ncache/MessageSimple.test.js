'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _utils = require('../utils');

var _context31 = require('../../../context');

var _MessageSimple = _interopRequireDefault(require('../MessageSimple'));

var _Modal = require('../../Modal');

var _Avatar = require('../../Avatar');

var _MML = require('../../MML');

var _MessageOptions = _interopRequireDefault(require('../MessageOptions'));

var _MessageText = _interopRequireDefault(require('../MessageText'));

var _MessageInput = require('../../MessageInput');

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

jest.mock('../MessageOptions', function () {
  return jest.fn(function () {
    return /*#__PURE__*/ _react.default.createElement('div', null);
  });
});
jest.mock('../MessageText', function () {
  return jest.fn(function () {
    return /*#__PURE__*/ _react.default.createElement('div', null);
  });
});
jest.mock('../../MML', function () {
  return {
    MML: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../Avatar', function () {
  return {
    Avatar: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../MessageInput', function () {
  return {
    MessageInput: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
    EditMessageForm: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../../Modal', function () {
  return {
    Modal: jest.fn(function (props) {
      return /*#__PURE__*/ _react.default.createElement(
        'div',
        null,
        props.children,
      );
    }),
  };
});
var alice = (0, _mockBuilders.generateUser)();
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
  image: 'bob-avatar.jpg',
});
var carol = (0, _mockBuilders.generateUser)();
var openThreadMock = jest.fn();
var tDateTimeParserMock = jest.fn(function () {
  return {
    calendar: jest.fn(),
  };
});
var retrySendMessageMock = jest.fn();

function renderMessageSimple(_x) {
  return _renderMessageSimple.apply(this, arguments);
}

function _renderMessageSimple() {
  _renderMessageSimple = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee30(message) {
      var props,
        channelConfig,
        channel,
        client,
        _args30 = arguments;
      return _regenerator.default.wrap(function _callee30$(_context30) {
        while (1) {
          switch ((_context30.prev = _context30.next)) {
            case 0:
              props =
                _args30.length > 1 && _args30[1] !== undefined
                  ? _args30[1]
                  : {};
              channelConfig =
                _args30.length > 2 && _args30[2] !== undefined
                  ? _args30[2]
                  : {
                      replies: true,
                      reactions: true,
                    };
              channel = (0, _mockBuilders.generateChannel)({
                getConfig: function getConfig() {
                  return channelConfig;
                },
              });
              _context30.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context30.sent;
              return _context30.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context31.ChannelContext.Provider,
                    {
                      value: {
                        client,
                        channel,
                        emojiConfig: _mockBuilders.emojiMockConfig,
                        openThread: openThreadMock,
                        retrySendMessage: retrySendMessageMock,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context31.TranslationContext.Provider,
                      {
                        value: {
                          t: function t(key) {
                            return key;
                          },
                          tDateTimeParser: tDateTimeParserMock,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _MessageSimple.default,
                        (0, _extends2.default)(
                          {
                            message: message,
                            typing: false,
                            getMessageActions: function getMessageActions() {
                              return Object.keys(_utils.MESSAGE_ACTIONS);
                            },
                            threadList: false,
                          },
                          props,
                        ),
                      ),
                    ),
                  ),
                ),
              );

            case 7:
            case 'end':
              return _context30.stop();
          }
        }
      }, _callee30);
    }),
  );
  return _renderMessageSimple.apply(this, arguments);
}

function generateAliceMessage(messageOptions) {
  return (0, _mockBuilders.generateMessage)(
    _objectSpread(
      {
        user: alice,
      },
      messageOptions,
    ),
  );
}

function generateBobMessage(messageOptions) {
  return (0, _mockBuilders.generateMessage)(
    _objectSpread(
      {
        user: bob,
      },
      messageOptions,
    ),
  );
}

var reactionSelectorTestId = 'reaction-selector';
describe('<MessageSimple />', function () {
  afterEach(_react2.cleanup);
  beforeEach(jest.clearAllMocks);
  it(
    'should not render anything if message is of type message.read',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var message, _yield$renderMessageS, container;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.read',
                });
                _context.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS = _context.sent;
                container = _yield$renderMessageS.container;
                expect(container).toBeEmptyDOMElement();

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should not render anything if message is of type message.date',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var message, _yield$renderMessageS2, container;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.date',
                });
                _context2.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS2 = _context2.sent;
                container = _yield$renderMessageS2.container;
                expect(container).toBeEmptyDOMElement();

              case 6:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should render deleted message with default MessageDelete component when message was deleted',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var deletedMessage, _yield$renderMessageS3, getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                deletedMessage = generateAliceMessage({
                  deleted_at: new Date('2019-12-17T03:24:00'),
                });
                _context3.next = 3;
                return renderMessageSimple(deletedMessage);

              case 3:
                _yield$renderMessageS3 = _context3.sent;
                getByTestId = _yield$renderMessageS3.getByTestId;
                expect(
                  getByTestId('message-deleted-component'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should render deleted message with custom component when message was deleted and a custom delete message component was passed',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var deletedMessage,
          CustomMessageDeletedComponent,
          _yield$renderMessageS4,
          getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                deletedMessage = generateAliceMessage({
                  deleted_at: new Date('2019-12-25T03:24:00'),
                });

                CustomMessageDeletedComponent = function CustomMessageDeletedComponent() {
                  return /*#__PURE__*/ _react.default.createElement(
                    'p',
                    {
                      'data-testid': 'custom-message-deleted',
                    },
                    'Gone!',
                  );
                };

                _context4.next = 4;
                return renderMessageSimple(deletedMessage, {
                  MessageDeleted: CustomMessageDeletedComponent,
                });

              case 4:
                _yield$renderMessageS4 = _context4.sent;
                getByTestId = _yield$renderMessageS4.getByTestId;
                expect(
                  getByTestId('custom-message-deleted'),
                ).toBeInTheDocument();

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should render custom edit message input component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var message, updateMessage, clearEditingState, CustomEditMessageInput;
        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                message = generateAliceMessage();
                updateMessage = jest.fn();
                clearEditingState = jest.fn();

                CustomEditMessageInput = function CustomEditMessageInput() {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'Edit Input',
                  );
                };

                _context5.next = 6;
                return renderMessageSimple(message, {
                  clearEditingState,
                  editing: true,
                  updateMessage,
                  EditMessageInput: CustomEditMessageInput,
                });

              case 6:
                expect(_MessageInput.MessageInput).toHaveBeenCalledWith(
                  expect.objectContaining({
                    clearEditingState,
                    message,
                    Input: CustomEditMessageInput,
                    updateMessage,
                  }),
                  {},
                );

              case 7:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should render reaction selector with custom component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message,
          CustomReactionSelector,
          _yield$renderMessageS5,
          getByTestId,
          onReactionListClick;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = generateBobMessage({
                  text: undefined,
                }); // Passing the ref prevents a react warning
                // eslint-disable-next-line no-unused-vars

                CustomReactionSelector = function CustomReactionSelector(
                  _ref7,
                  ref,
                ) {
                  var handleReaction = _ref7.handleReaction;
                  return /*#__PURE__*/ _react.default.createElement(
                    'ul',
                    {
                      'data-testid': 'custom-reaction-selector',
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      'li',
                      null,
                      /*#__PURE__*/ _react.default.createElement(
                        'button',
                        {
                          onClick: function onClick(e) {
                            return handleReaction('smile-emoticon', e);
                          },
                        },
                        ':)',
                      ),
                    ),
                    /*#__PURE__*/ _react.default.createElement(
                      'li',
                      null,
                      /*#__PURE__*/ _react.default.createElement(
                        'button',
                        {
                          onClick: function onClick(e) {
                            return handleReaction('sad-emoticon', e);
                          },
                        },
                        ':(',
                      ),
                    ),
                  );
                };

                _context6.next = 4;
                return renderMessageSimple(message, {
                  ReactionSelector: /*#__PURE__*/ _react.default.forwardRef(
                    CustomReactionSelector,
                  ),
                });

              case 4:
                _yield$renderMessageS5 = _context6.sent;
                getByTestId = _yield$renderMessageS5.getByTestId;
                onReactionListClick =
                  _MessageOptions.default.mock.calls[0][0].onReactionListClick;
                (0, _react2.act)(function () {
                  return onReactionListClick();
                });
                expect(
                  getByTestId('custom-reaction-selector'),
                ).toBeInTheDocument();

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should not render reaction list if reaction is disbaled in channel config',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var bobReaction, message, _yield$renderMessageS6, queryByTestId;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  text: undefined,
                  latest_reactions: [bobReaction],
                });
                _context7.next = 4;
                return renderMessageSimple(
                  message,
                  {},
                  {
                    reactions: false,
                  },
                );

              case 4:
                _yield$renderMessageS6 = _context7.sent;
                queryByTestId = _yield$renderMessageS6.queryByTestId;
                expect(queryByTestId('reaction-list')).toBeNull();

              case 7:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should render reaction list with custom component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var bobReaction,
          message,
          CustomReactionsList,
          _yield$renderMessageS7,
          getByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                  type: 'cool-reaction',
                });
                message = generateAliceMessage({
                  text: undefined,
                  latest_reactions: [bobReaction],
                });

                CustomReactionsList = function CustomReactionsList(_ref10) {
                  var reactions = _ref10.reactions;
                  return /*#__PURE__*/ _react.default.createElement(
                    'ul',
                    {
                      'data-testid': 'custom-reaction-list',
                    },
                    reactions.map(function (reaction) {
                      if (reaction.type === 'cool-reaction') {
                        return /*#__PURE__*/ _react.default.createElement(
                          'li',
                          {
                            key: reaction.type + reaction.user_id,
                          },
                          ':)',
                        );
                      }

                      return /*#__PURE__*/ _react.default.createElement(
                        'li',
                        {
                          key: reaction.type + reaction.user_id,
                        },
                        '?',
                      );
                    }),
                  );
                };

                _context8.next = 5;
                return renderMessageSimple(message, {
                  ReactionsList: CustomReactionsList,
                });

              case 5:
                _yield$renderMessageS7 = _context8.sent;
                getByTestId = _yield$renderMessageS7.getByTestId;
                expect(getByTestId('custom-reaction-list')).toBeInTheDocument();

              case 8:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should render an edit form in a modal when in edit mode',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message, clearEditingState, updateMessage;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                message = generateAliceMessage();
                clearEditingState = jest.fn();
                updateMessage = jest.fn();
                _context9.next = 5;
                return renderMessageSimple(message, {
                  editing: true,
                  clearEditingState,
                  updateMessage,
                });

              case 5:
                expect(_Modal.Modal).toHaveBeenCalledWith(
                  expect.objectContaining({
                    open: true,
                    onClose: clearEditingState,
                  }),
                  {},
                );
                expect(_MessageInput.MessageInput).toHaveBeenCalledWith(
                  expect.objectContaining({
                    clearEditingState,
                    message,
                    Input: _MessageInput.EditMessageForm,
                    updateMessage,
                  }),
                  {},
                );

              case 7:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should render no status when message not from the current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message, _yield$renderMessageS8, queryByTestId;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = generateAliceMessage();
                _context10.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS8 = _context10.sent;
                queryByTestId = _yield$renderMessageS8.queryByTestId;
                expect(queryByTestId(/message-status/)).toBeNull();

              case 6:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it(
    'should not render status when message is an error message',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var message, _yield$renderMessageS9, queryByTestId;

        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'error',
                });
                _context11.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS9 = _context11.sent;
                queryByTestId = _yield$renderMessageS9.queryByTestId;
                expect(queryByTestId(/message-status/)).toBeNull();

              case 6:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11);
      }),
    ),
  );
  it(
    'should render sending status when sending message',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var message, _yield$renderMessageS10, getByTestId;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                message = generateAliceMessage({
                  status: 'sending',
                });
                _context12.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS10 = _context12.sent;
                getByTestId = _yield$renderMessageS10.getByTestId;
                expect(
                  getByTestId('message-status-sending'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12);
      }),
    ),
  );
  it(
    'should render the "read by" status when the message is not part of a thread and was read by another chat members',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var message, _yield$renderMessageS11, getByTestId;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                message = generateAliceMessage();
                _context13.next = 3;
                return renderMessageSimple(message, {
                  readBy: [alice, bob],
                });

              case 3:
                _yield$renderMessageS11 = _context13.sent;
                getByTestId = _yield$renderMessageS11.getByTestId;
                expect(
                  getByTestId('message-status-read-by'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13);
      }),
    ),
  );
  it(
    'should render the "read by many" status when the message is not part of a thread and was read by more than one other chat members',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
        var message, _yield$renderMessageS12, getByTestId;

        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch ((_context14.prev = _context14.next)) {
              case 0:
                message = generateAliceMessage();
                _context14.next = 3;
                return renderMessageSimple(message, {
                  readBy: [alice, bob, carol],
                });

              case 3:
                _yield$renderMessageS12 = _context14.sent;
                getByTestId = _yield$renderMessageS12.getByTestId;
                expect(
                  getByTestId('message-status-read-by-many'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14);
      }),
    ),
  );
  it(
    'should render a received status when the message has a received status and it is the same message as the last received one',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
        var message, _yield$renderMessageS13, getByTestId;

        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch ((_context15.prev = _context15.next)) {
              case 0:
                message = generateAliceMessage({
                  status: 'received',
                });
                _context15.next = 3;
                return renderMessageSimple(message, {
                  lastReceivedId: message.id,
                });

              case 3:
                _yield$renderMessageS13 = _context15.sent;
                getByTestId = _yield$renderMessageS13.getByTestId;
                expect(
                  getByTestId('message-status-received'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15);
      }),
    ),
  );
  it(
    'should not render status when rendered in a thread list and was read by other members',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
        var message, _yield$renderMessageS14, queryByTestId;

        return _regenerator.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch ((_context16.prev = _context16.next)) {
              case 0:
                message = generateAliceMessage();
                _context16.next = 3;
                return renderMessageSimple(message, {
                  threadList: true,
                  readBy: [alice, bob, carol],
                });

              case 3:
                _yield$renderMessageS14 = _context16.sent;
                queryByTestId = _yield$renderMessageS14.queryByTestId;
                expect(queryByTestId(/message-status/)).toBeNull();

              case 6:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16);
      }),
    ),
  );
  it(
    "should render the message user's avatar",
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
        var message;
        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch ((_context17.prev = _context17.next)) {
              case 0:
                message = generateBobMessage();
                _context17.next = 3;
                return renderMessageSimple(message, {
                  onUserClick: jest.fn(),
                  onUserHover: jest.fn(),
                });

              case 3:
                expect(_Avatar.Avatar).toHaveBeenCalledWith(
                  {
                    image: message.user.image,
                    name: message.user.name,
                    onClick: expect.any(Function),
                    onMouseOver: expect.any(Function),
                  },
                  {},
                );

              case 4:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17);
      }),
    ),
  );
  it(
    'should allow message to be retried when it failed',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
        var message, _yield$renderMessageS15, getByTestId;

        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch ((_context18.prev = _context18.next)) {
              case 0:
                message = generateAliceMessage({
                  status: 'failed',
                });
                _context18.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS15 = _context18.sent;
                getByTestId = _yield$renderMessageS15.getByTestId;
                expect(retrySendMessageMock).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId('message-inner'));

                expect(retrySendMessageMock).toHaveBeenCalledWith(message);

              case 8:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18);
      }),
    ),
  );
  it(
    'should render message options',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
        var message;
        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch ((_context19.prev = _context19.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                _context19.next = 3;
                return renderMessageSimple(message, {
                  handleOpenThread: jest.fn(),
                });

              case 3:
                expect(_MessageOptions.default).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message,
                    threadList: false,
                    messageWrapperRef: expect.any(Object),
                    onReactionListClick: expect.any(Function),
                    handleOpenThread: expect.any(Function),
                  }),
                  {},
                );

              case 4:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19);
      }),
    ),
  );
  it(
    'should render MML',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
        var mml, message;
        return _regenerator.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch ((_context20.prev = _context20.next)) {
              case 0:
                mml = '<mml>text</mml>';
                message = generateAliceMessage({
                  mml,
                });
                _context20.next = 4;
                return renderMessageSimple(message);

              case 4:
                expect(_MML.MML).toHaveBeenCalledWith(
                  expect.objectContaining({
                    source: mml,
                    align: 'right',
                  }),
                  {},
                );

              case 5:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20);
      }),
    ),
  );
  it(
    'should render MML on left for others',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
        var mml, message;
        return _regenerator.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch ((_context21.prev = _context21.next)) {
              case 0:
                mml = '<mml>text</mml>';
                message = generateBobMessage({
                  mml,
                });
                _context21.next = 4;
                return renderMessageSimple(message);

              case 4:
                expect(_MML.MML).toHaveBeenCalledWith(
                  expect.objectContaining({
                    source: mml,
                    align: 'left',
                  }),
                  {},
                );

              case 5:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21);
      }),
    ),
  );
  it(
    'should render message text when message has text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee22() {
        var message, actionsEnabled, messageListRect, unsafeHTML;
        return _regenerator.default.wrap(function _callee22$(_context22) {
          while (1) {
            switch ((_context22.prev = _context22.next)) {
              case 0:
                message = generateAliceMessage({
                  text: 'Hello',
                });
                actionsEnabled = true;
                messageListRect = {
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 100,
                  top: 0,
                  right: 100,
                  bottom: 100,
                  left: 0,
                  toJSON: function toJSON() {},
                };
                unsafeHTML = false;
                _context22.next = 6;
                return renderMessageSimple(message, {
                  actionsEnabled,
                  messageListRect,
                  unsafeHTML,
                });

              case 6:
                expect(_MessageText.default).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message,
                    actionsEnabled,
                    messageListRect,
                    unsafeHTML,
                    reactionSelectorRef: expect.any(Object),
                  }),
                  {},
                );

              case 7:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22);
      }),
    ),
  );
  it(
    'should display detailed reactions when reactions action is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee23() {
        var message,
          _yield$renderMessageS16,
          queryByTestId,
          onReactionListClick;

        return _regenerator.default.wrap(function _callee23$(_context23) {
          while (1) {
            switch ((_context23.prev = _context23.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                _context23.next = 3;
                return renderMessageSimple(
                  message,
                  {},
                  {
                    reactions: true,
                  },
                );

              case 3:
                _yield$renderMessageS16 = _context23.sent;
                queryByTestId = _yield$renderMessageS16.queryByTestId;
                onReactionListClick =
                  _MessageOptions.default.mock.calls[0][0].onReactionListClick;
                (0, _react2.act)(function () {
                  return onReactionListClick();
                });
                expect(
                  queryByTestId(reactionSelectorTestId),
                ).toBeInTheDocument();

              case 8:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23);
      }),
    ),
  );
  it(
    'should display non image attachments in Attachment component when message has attachments that are not images',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee24() {
        var attachment, message, _yield$renderMessageS17, queryAllByTestId;

        return _regenerator.default.wrap(function _callee24$(_context24) {
          while (1) {
            switch ((_context24.prev = _context24.next)) {
              case 0:
                attachment = {
                  type: 'file',
                  asset_url: 'file.pdf',
                };
                message = generateAliceMessage({
                  attachments: [attachment, attachment, attachment],
                });
                _context24.next = 4;
                return renderMessageSimple(message);

              case 4:
                _yield$renderMessageS17 = _context24.sent;
                queryAllByTestId = _yield$renderMessageS17.queryAllByTestId;
                expect(queryAllByTestId('attachment-file')).toHaveLength(3);

              case 7:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24);
      }),
    ),
  );
  it(
    'should display image attachments in gallery when message has image attachments',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
        var attachment, message, _yield$renderMessageS18, queryAllByTestId;

        return _regenerator.default.wrap(function _callee25$(_context25) {
          while (1) {
            switch ((_context25.prev = _context25.next)) {
              case 0:
                attachment = {
                  type: 'image',
                  image_url: 'image.jpg',
                };
                message = generateAliceMessage({
                  attachments: [attachment, attachment, attachment],
                });
                _context25.next = 4;
                return renderMessageSimple(message);

              case 4:
                _yield$renderMessageS18 = _context25.sent;
                queryAllByTestId = _yield$renderMessageS18.queryAllByTestId;
                expect(queryAllByTestId('gallery-image')).toHaveLength(3);

              case 7:
              case 'end':
                return _context25.stop();
            }
          }
        }, _callee25);
      }),
    ),
  );
  it(
    'should display reply count and handle replies count button click when not in thread list and reply count is not 0',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
        var message, _yield$renderMessageS19, getByTestId;

        return _regenerator.default.wrap(function _callee26$(_context26) {
          while (1) {
            switch ((_context26.prev = _context26.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                _context26.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS19 = _context26.sent;
                getByTestId = _yield$renderMessageS19.getByTestId;
                expect(getByTestId('replies-count-button')).toBeInTheDocument();

              case 6:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26);
      }),
    ),
  );
  it(
    'should open thread when reply count button is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
        var message, _yield$renderMessageS20, getByTestId;

        return _regenerator.default.wrap(function _callee27$(_context27) {
          while (1) {
            switch ((_context27.prev = _context27.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                _context27.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS20 = _context27.sent;
                getByTestId = _yield$renderMessageS20.getByTestId;
                expect(openThreadMock).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId('replies-count-button'));

                expect(openThreadMock).toHaveBeenCalledWith(
                  message,
                  expect.any(Object), // The event object
                );

              case 8:
              case 'end':
                return _context27.stop();
            }
          }
        }, _callee27);
      }),
    ),
  );
  it(
    "should display message's user name when message not from the current user",
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
        var message, _yield$renderMessageS21, getByText;

        return _regenerator.default.wrap(function _callee28$(_context28) {
          while (1) {
            switch ((_context28.prev = _context28.next)) {
              case 0:
                message = generateBobMessage();
                _context28.next = 3;
                return renderMessageSimple(message);

              case 3:
                _yield$renderMessageS21 = _context28.sent;
                getByText = _yield$renderMessageS21.getByText;
                expect(getByText(bob.name)).toBeInTheDocument();

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
    "should display message's timestamp",
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
        var messageDate,
          parsedDateText,
          message,
          _yield$renderMessageS22,
          getByText;

        return _regenerator.default.wrap(function _callee29$(_context29) {
          while (1) {
            switch ((_context29.prev = _context29.next)) {
              case 0:
                messageDate = new Date('2019-12-25T01:00:00');
                parsedDateText = 'last christmas';
                message = generateAliceMessage({
                  created_at: messageDate,
                });
                tDateTimeParserMock.mockImplementation(function () {
                  return {
                    calendar: function calendar() {
                      return parsedDateText;
                    },
                  };
                });
                _context29.next = 6;
                return renderMessageSimple(message);

              case 6:
                _yield$renderMessageS22 = _context29.sent;
                getByText = _yield$renderMessageS22.getByText;
                expect(tDateTimeParserMock).toHaveBeenCalledWith(messageDate);
                expect(getByText(parsedDateText)).toBeInTheDocument();

              case 10:
              case 'end':
                return _context29.stop();
            }
          }
        }, _callee29);
      }),
    ),
  );
});
