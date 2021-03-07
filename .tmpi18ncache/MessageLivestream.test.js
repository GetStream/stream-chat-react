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

var _MessageLivestream = _interopRequireDefault(
  require('../MessageLivestream'),
);

var _Avatar = require('../../Avatar');

var _MessageInput = require('../../MessageInput');

var _MessageActions = require('../../MessageActions');

var _context43 = require('../../../context');

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
  };
});
jest.mock('../../MessageActions', function () {
  return {
    MessageActions: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
  image: 'alice-avatar.jpg',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
  image: 'bob-avatar.jpg',
});

function renderMessageLivestream(_x) {
  return _renderMessageLivestream.apply(this, arguments);
}

function _renderMessageLivestream() {
  _renderMessageLivestream = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee42(message) {
      var props,
        channelConfig,
        channel,
        client,
        customDateTimeParser,
        _args42 = arguments;
      return _regenerator.default.wrap(function _callee42$(_context42) {
        while (1) {
          switch ((_context42.prev = _context42.next)) {
            case 0:
              props =
                _args42.length > 1 && _args42[1] !== undefined
                  ? _args42[1]
                  : {};
              channelConfig =
                _args42.length > 2 && _args42[2] !== undefined
                  ? _args42[2]
                  : {
                      replies: true,
                      reactions: true,
                    };
              channel = (0, _mockBuilders.generateChannel)({
                getConfig: function getConfig() {
                  return channelConfig;
                },
              });
              _context42.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context42.sent;
              customDateTimeParser = jest.fn(function () {
                return {
                  format: jest.fn(),
                };
              });
              return _context42.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context43.ChannelContext.Provider,
                    {
                      value: {
                        client,
                        channel,
                        emojiConfig: _mockBuilders.emojiMockConfig,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context43.TranslationContext.Provider,
                      {
                        value: {
                          t: function t(key) {
                            return key;
                          },
                          tDateTimeParser: customDateTimeParser,
                          userLanguage: 'en',
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _MessageLivestream.default,
                        (0, _extends2.default)(
                          {
                            message: message,
                            typing: false,
                          },
                          props,
                        ),
                      ),
                    ),
                  ),
                ),
              );

            case 8:
            case 'end':
              return _context42.stop();
          }
        }
      }, _callee42);
    }),
  );
  return _renderMessageLivestream.apply(this, arguments);
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

var pdfAttachment = {
  type: 'file',
  asset_url: 'file.pdf',
};
var imageAttachment = {
  type: 'image',
  image_url: 'image.jpg',
};
var messageLivestreamWrapperTestId = 'message-livestream';
var messageLiveStreamReactionsTestId = 'message-livestream-reactions-action';
var reactionSelectorTestId = 'reaction-selector';
var messageLivestreamthreadTestId = 'message-livestream-thread-action';
var messageLivestreamTextTestId = 'message-livestream-text';
var messageLivestreamErrorTestId = 'message-livestream-error';
var messageLivestreamCommandErrorTestId = 'message-livestream-command-error';
describe('<MessageLivestream />', function () {
  afterEach(_react2.cleanup);
  beforeEach(jest.clearAllMocks);
  it(
    'should not render anything if message is of type message.read',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var message, _yield$renderMessageL, container;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.read',
                });
                _context.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL = _context.sent;
                container = _yield$renderMessageL.container;
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
        var message, _yield$renderMessageL2, container;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.date',
                });
                _context2.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL2 = _context2.sent;
                container = _yield$renderMessageL2.container;
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
    'should render deleted message with custom component when message was deleted and a custom delete message component was passed',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var deletedMessage,
          CustomMessageDeletedComponent,
          _yield$renderMessageL3,
          getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                deletedMessage = generateAliceMessage({
                  deleted_at: new Date('2019-12-17T03:24:00'),
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

                _context3.next = 4;
                return renderMessageLivestream(deletedMessage, {
                  MessageDeleted: CustomMessageDeletedComponent,
                });

              case 4:
                _yield$renderMessageL3 = _context3.sent;
                getByTestId = _yield$renderMessageL3.getByTestId;
                expect(
                  getByTestId('custom-message-deleted'),
                ).toBeInTheDocument();

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should render reaction selector with custom component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var message,
          customSelectorTestId,
          CustomReactionSelector,
          _yield$renderMessageL4,
          getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                customSelectorTestId = 'custom-reaction-selector'; // Passing the ref prevents a react warning
                // eslint-disable-next-line no-unused-vars

                CustomReactionSelector = function CustomReactionSelector(
                  props,
                  ref,
                ) {
                  return /*#__PURE__*/ _react.default.createElement(
                    'ul',
                    {
                      'data-testid': customSelectorTestId,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      'li',
                      null,
                      /*#__PURE__*/ _react.default.createElement(
                        'button',
                        {
                          onClick: function onClick(e) {
                            return props.handleReaction('smile-emoticon', e);
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
                            return props.handleReaction('sad-emoticon', e);
                          },
                        },
                        ':(',
                      ),
                    ),
                  );
                };

                _context4.next = 5;
                return renderMessageLivestream(
                  message,
                  {
                    ReactionSelector: /*#__PURE__*/ _react.default.forwardRef(
                      CustomReactionSelector,
                    ),
                  },
                  {
                    reactions: true,
                  },
                );

              case 5:
                _yield$renderMessageL4 = _context4.sent;
                getByTestId = _yield$renderMessageL4.getByTestId;

                _react2.fireEvent.click(
                  getByTestId(messageLiveStreamReactionsTestId),
                );

                expect(getByTestId(customSelectorTestId)).toBeInTheDocument();

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should render reaction list with custom component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var bobReaction,
          message,
          CustomReactionsList,
          _yield$renderMessageL5,
          getByTestId;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                  type: 'cool-reaction',
                });
                message = generateAliceMessage({
                  text: undefined,
                  latest_reactions: [bobReaction],
                });

                CustomReactionsList = function CustomReactionsList(_ref6) {
                  var reactions = _ref6.reactions;
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

                _context5.next = 5;
                return renderMessageLivestream(
                  message,
                  {
                    ReactionsList: CustomReactionsList,
                  },
                  {
                    reactions: true,
                  },
                );

              case 5:
                _yield$renderMessageL5 = _context5.sent;
                getByTestId = _yield$renderMessageL5.getByTestId;
                expect(getByTestId('custom-reaction-list')).toBeInTheDocument();

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
    'should render custom avatar component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message, CustomAvatar, _yield$renderMessageL6, getByTestId;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = generateAliceMessage();

                CustomAvatar = function CustomAvatar() {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    {
                      'data-testid': 'custom-avatar',
                    },
                    'Avatar',
                  );
                };

                _context6.next = 4;
                return renderMessageLivestream(message, {
                  Avatar: CustomAvatar,
                });

              case 4:
                _yield$renderMessageL6 = _context6.sent;
                getByTestId = _yield$renderMessageL6.getByTestId;
                expect(getByTestId('custom-avatar')).toBeInTheDocument();

              case 7:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should render pin indicator when pinned is true',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var message, CustomPinIndicator, _yield$renderMessageL7, getByTestId;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                message = generateAliceMessage({
                  pinned: true,
                });

                CustomPinIndicator = function CustomPinIndicator() {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    {
                      'data-testid': 'pin-indicator',
                    },
                    'Pin Indicator',
                  );
                };

                _context7.next = 4;
                return renderMessageLivestream(message, {
                  PinIndicator: CustomPinIndicator,
                });

              case 4:
                _yield$renderMessageL7 = _context7.sent;
                getByTestId = _yield$renderMessageL7.getByTestId;
                _context7.next = 8;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('pin-indicator')).toBeInTheDocument();
                });

              case 8:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should not render pin indicator when pinned is false',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var message,
          CustomPinIndicator,
          _yield$renderMessageL8,
          queryAllByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                message = generateAliceMessage({
                  pinned: false,
                });

                CustomPinIndicator = function CustomPinIndicator() {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    {
                      'data-testid': 'pin-indicator',
                    },
                    'Pin Indicator',
                  );
                };

                _context8.next = 4;
                return renderMessageLivestream(message, {
                  PinIndicator: CustomPinIndicator,
                });

              case 4:
                _yield$renderMessageL8 = _context8.sent;
                queryAllByTestId = _yield$renderMessageL8.queryAllByTestId;
                _context8.next = 8;
                return (0, _react2.waitFor)(function () {
                  expect(queryAllByTestId('pin-indicator')).toHaveLength(0);
                });

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
    'should render custom edit message input component when one is given',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message, updateMessage, clearEditingState, CustomEditMessageInput;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
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

                _context9.next = 6;
                return renderMessageLivestream(message, {
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
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should render message input when in edit mode',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message, updateMessage, clearEditingState;
        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = generateAliceMessage();
                updateMessage = jest.fn();
                clearEditingState = jest.fn();
                _context10.next = 5;
                return renderMessageLivestream(message, {
                  clearEditingState,
                  editing: true,
                  updateMessage,
                });

              case 5:
                expect(_MessageInput.MessageInput).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message,
                    updateMessage,
                    clearEditingState,
                  }),
                  {},
                );

              case 6:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it.each([
    [
      'should display',
      'top',
      {
        shouldDisplay: true,
      },
    ],
    [
      'should display',
      'single',
      {
        shouldDisplay: true,
      },
    ],
    [
      'should not display',
      'middle',
      {
        shouldDisplay: false,
      },
    ],
    [
      'should not display',
      'bottom',
      {
        shouldDisplay: false,
      },
    ],
  ])(
    '%s avatar component when rendered in edit mode and with first group style set to %s',
    /*#__PURE__*/ (function () {
      var _ref13 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee11(
          _,
          groupStyle,
          _ref12,
        ) {
          var shouldDisplay, message, _yield$renderMessageL9, getByTestId;

          return _regenerator.default.wrap(function _callee11$(_context11) {
            while (1) {
              switch ((_context11.prev = _context11.next)) {
                case 0:
                  shouldDisplay = _ref12.shouldDisplay;
                  message = generateAliceMessage();
                  _context11.next = 4;
                  return renderMessageLivestream(message, {
                    editing: true,
                    groupStyles: [groupStyle],
                  });

                case 4:
                  _yield$renderMessageL9 = _context11.sent;
                  getByTestId = _yield$renderMessageL9.getByTestId;
                  expect(
                    getByTestId('message-livestream-edit').className,
                  ).toContain('--'.concat(groupStyle));

                  if (shouldDisplay) {
                    expect(_Avatar.Avatar).toHaveBeenCalledWith(
                      {
                        onClick: expect.any(Function),
                        onMouseOver: expect.any(Function),
                        size: 40,
                        image: alice.image,
                        name: alice.name,
                      },
                      {},
                    );
                  } else {
                    expect(_Avatar.Avatar).not.toHaveBeenCalledWith();
                  }

                case 8:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11);
        }),
      );

      return function (_x2, _x3, _x4) {
        return _ref13.apply(this, arguments);
      };
    })(),
  );
  it(
    'should set group style as css class modifier',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var message, groupStyle, _yield$renderMessageL10, getByTestId;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                message = generateAliceMessage();
                groupStyle = 'set-group-style';
                _context12.next = 4;
                return renderMessageLivestream(message, {
                  groupStyles: [groupStyle],
                });

              case 4:
                _yield$renderMessageL10 = _context12.sent;
                getByTestId = _yield$renderMessageL10.getByTestId;
                expect(
                  getByTestId(messageLivestreamWrapperTestId).className,
                ).toContain('--'.concat(groupStyle));

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
    'should set message type as css class modifier',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var messageType, message, _yield$renderMessageL11, getByTestId;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                messageType = 'message-type';
                message = generateAliceMessage({
                  type: messageType,
                });
                _context13.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL11 = _context13.sent;
                getByTestId = _yield$renderMessageL11.getByTestId;
                expect(
                  getByTestId(messageLivestreamWrapperTestId).className,
                ).toContain('--'.concat(messageType));

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
    'should set message status as css class modifier',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
        var messageStatus, message, _yield$renderMessageL12, getByTestId;

        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch ((_context14.prev = _context14.next)) {
              case 0:
                messageStatus = 'message-status';
                message = generateAliceMessage({
                  status: messageStatus,
                });
                _context14.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL12 = _context14.sent;
                getByTestId = _yield$renderMessageL12.getByTestId;
                expect(
                  getByTestId(messageLivestreamWrapperTestId).className,
                ).toContain('--'.concat(messageStatus));

              case 7:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14);
      }),
    ),
  );
  it(
    'should set initial message css class when message is the first one in a thread',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
        var message, _yield$renderMessageL13, getByTestId;

        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch ((_context15.prev = _context15.next)) {
              case 0:
                message = generateAliceMessage();
                _context15.next = 3;
                return renderMessageLivestream(message, {
                  initialMessage: true,
                });

              case 3:
                _yield$renderMessageL13 = _context15.sent;
                getByTestId = _yield$renderMessageL13.getByTestId;
                expect(
                  getByTestId(messageLivestreamWrapperTestId).className,
                ).toContain('--initial-message');

              case 6:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15);
      }),
    ),
  );
  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'failed'],
    ['status', 'sending'],
  ])(
    'should not render actions if message is of %s %s',
    /*#__PURE__*/ (function () {
      var _ref18 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee16(key, value) {
          var message, _yield$renderMessageL14, queryByTestId;

          return _regenerator.default.wrap(function _callee16$(_context16) {
            while (1) {
              switch ((_context16.prev = _context16.next)) {
                case 0:
                  message = generateAliceMessage({
                    [key]: value,
                    text: undefined,
                  });
                  _context16.next = 3;
                  return renderMessageLivestream(message);

                case 3:
                  _yield$renderMessageL14 = _context16.sent;
                  queryByTestId = _yield$renderMessageL14.queryByTestId;
                  expect(
                    queryByTestId('message-livestream-actions'),
                  ).toBeNull();

                case 6:
                case 'end':
                  return _context16.stop();
              }
            }
          }, _callee16);
        }),
      );

      return function (_x5, _x6) {
        return _ref18.apply(this, arguments);
      };
    })(),
  );
  it(
    'should display the formatted message creation date',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
        var createdAt,
          message,
          format,
          mockDateTimeParser,
          _yield$renderMessageL15,
          getByText;

        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch ((_context17.prev = _context17.next)) {
              case 0:
                createdAt = new Date('2019-12-12T03:33:00');
                message = generateAliceMessage({
                  created_at: createdAt,
                });
                format = jest.fn(function () {
                  return createdAt.toDateString();
                });
                mockDateTimeParser = jest.fn(function () {
                  return {
                    format,
                  };
                });
                _context17.next = 6;
                return renderMessageLivestream(message, {
                  tDateTimeParser: mockDateTimeParser,
                });

              case 6:
                _yield$renderMessageL15 = _context17.sent;
                getByText = _yield$renderMessageL15.getByText;
                expect(mockDateTimeParser).toHaveBeenCalledWith(createdAt);
                expect(format).toHaveBeenCalledWith('h:mmA');
                expect(getByText(createdAt.toDateString())).toBeInTheDocument();

              case 11:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17);
      }),
    ),
  );
  it(
    'should display a reactions icon when channel has reactions enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
        var message, _yield$renderMessageL16, getByTestId;

        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch ((_context18.prev = _context18.next)) {
              case 0:
                message = generateAliceMessage();
                _context18.next = 3;
                return renderMessageLivestream(message, {
                  channelConfig: {
                    reactions: true,
                  },
                });

              case 3:
                _yield$renderMessageL16 = _context18.sent;
                getByTestId = _yield$renderMessageL16.getByTestId;
                expect(
                  getByTestId(messageLiveStreamReactionsTestId),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18);
      }),
    ),
  );
  it(
    'should open reaction selector when reaction action is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
        var message, _yield$renderMessageL17, getByTestId, queryByTestId;

        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch ((_context19.prev = _context19.next)) {
              case 0:
                message = generateAliceMessage();
                _context19.next = 3;
                return renderMessageLivestream(message, {
                  channelConfig: {
                    reactions: true,
                  },
                });

              case 3:
                _yield$renderMessageL17 = _context19.sent;
                getByTestId = _yield$renderMessageL17.getByTestId;
                queryByTestId = _yield$renderMessageL17.queryByTestId;
                expect(queryByTestId(reactionSelectorTestId)).toBeNull();

                _react2.fireEvent.click(
                  getByTestId(messageLiveStreamReactionsTestId),
                );

                expect(
                  getByTestId(messageLiveStreamReactionsTestId),
                ).toBeInTheDocument();

              case 9:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19);
      }),
    ),
  );
  it(
    'should close the reaction selector when mouse leaves the message wrapper',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
        var message,
          _yield$renderMessageL18,
          getByTestId,
          queryByTestId,
          mouseLeave;

        return _regenerator.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch ((_context20.prev = _context20.next)) {
              case 0:
                message = generateAliceMessage();
                _context20.next = 3;
                return renderMessageLivestream(message, {
                  channelConfig: {
                    reactions: true,
                  },
                });

              case 3:
                _yield$renderMessageL18 = _context20.sent;
                getByTestId = _yield$renderMessageL18.getByTestId;
                queryByTestId = _yield$renderMessageL18.queryByTestId;

                _react2.fireEvent.click(
                  getByTestId(messageLiveStreamReactionsTestId),
                );

                expect(
                  getByTestId(messageLiveStreamReactionsTestId),
                ).toBeInTheDocument();
                mouseLeave = new MouseEvent('mouseleave', {
                  bubbles: false,
                  cancelable: false,
                });
                (0, _react2.fireEvent)(
                  getByTestId(messageLivestreamWrapperTestId),
                  mouseLeave,
                );
                expect(queryByTestId(reactionSelectorTestId)).toBeNull();

              case 11:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20);
      }),
    ),
  );
  it(
    'should display thread action button when channel has replies enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
        var message, _yield$renderMessageL19, getByTestId;

        return _regenerator.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch ((_context21.prev = _context21.next)) {
              case 0:
                message = generateAliceMessage();
                _context21.next = 3;
                return renderMessageLivestream(message, {
                  channelConfig: {
                    replies: true,
                  },
                });

              case 3:
                _yield$renderMessageL19 = _context21.sent;
                getByTestId = _yield$renderMessageL19.getByTestId;
                expect(
                  getByTestId(messageLivestreamthreadTestId),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21);
      }),
    ),
  );
  it(
    'should display text in users set language',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee22() {
        var message, _yield$renderMessageL20, getByText, debug;

        return _regenerator.default.wrap(function _callee22$(_context22) {
          while (1) {
            switch ((_context22.prev = _context22.next)) {
              case 0:
                message = generateAliceMessage({
                  i18n: {
                    fr_text: 'bonjour',
                    en_text: 'hello',
                    language: 'fr',
                  },
                  text: 'bonjour',
                });
                _context22.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL20 = _context22.sent;
                getByText = _yield$renderMessageL20.getByText;
                debug = _yield$renderMessageL20.debug;
                debug();
                expect(getByText('hello')).toBeInTheDocument();

              case 8:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22);
      }),
    ),
  );
  it(
    'should open thread when thread action button is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee23() {
        var message, handleOpenThread, _yield$renderMessageL21, getByTestId;

        return _regenerator.default.wrap(function _callee23$(_context23) {
          while (1) {
            switch ((_context23.prev = _context23.next)) {
              case 0:
                message = generateAliceMessage();
                handleOpenThread = jest.fn();
                _context23.next = 4;
                return renderMessageLivestream(message, {
                  handleOpenThread,
                  channelConfig: {
                    replies: true,
                  },
                });

              case 4:
                _yield$renderMessageL21 = _context23.sent;
                getByTestId = _yield$renderMessageL21.getByTestId;
                expect(handleOpenThread).not.toHaveBeenCalled();

                _react2.fireEvent.click(
                  getByTestId(messageLivestreamthreadTestId),
                );

                expect(handleOpenThread).toHaveBeenCalledWith(
                  expect.any(Object), // THe click event
                );

              case 9:
              case 'end':
                return _context23.stop();
            }
          }
        }, _callee23);
      }),
    ),
  );
  it(
    'should render action options',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee24() {
        var message, getMessageActions;
        return _regenerator.default.wrap(function _callee24$(_context24) {
          while (1) {
            switch ((_context24.prev = _context24.next)) {
              case 0:
                message = generateAliceMessage();

                getMessageActions = function getMessageActions() {
                  return ['edit, delete'];
                };

                _context24.next = 4;
                return renderMessageLivestream(message, {
                  getMessageActions,
                });

              case 4:
                expect(_MessageActions.MessageActions).toHaveBeenCalledTimes(1);

              case 5:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24);
      }),
    ),
  );
  it(
    'should render the user avatar',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
        var message;
        return _regenerator.default.wrap(function _callee25$(_context25) {
          while (1) {
            switch ((_context25.prev = _context25.next)) {
              case 0:
                message = generateAliceMessage();
                _context25.next = 3;
                return renderMessageLivestream(message);

              case 3:
                expect(_Avatar.Avatar).toHaveBeenCalledWith(
                  {
                    onClick: expect.any(Function),
                    onMouseOver: expect.any(Function),
                    size: 30,
                    image: alice.image,
                    name: alice.name,
                  },
                  {},
                );

              case 4:
              case 'end':
                return _context25.stop();
            }
          }
        }, _callee25);
      }),
    ),
  );
  it(
    'should render the user name',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
        var message, _yield$renderMessageL22, getByText;

        return _regenerator.default.wrap(function _callee26$(_context26) {
          while (1) {
            switch ((_context26.prev = _context26.next)) {
              case 0:
                message = generateAliceMessage();
                _context26.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL22 = _context26.sent;
                getByText = _yield$renderMessageL22.getByText;
                expect(getByText(alice.name)).toBeInTheDocument();

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
    'should inform user about error visibility when message is of error type',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
        var message, _yield$renderMessageL23, getByText;

        return _regenerator.default.wrap(function _callee27$(_context27) {
          while (1) {
            switch ((_context27.prev = _context27.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'error',
                });
                _context27.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL23 = _context27.sent;
                getByText = _yield$renderMessageL23.getByText;
                expect(getByText('Only visible to you')).toBeInTheDocument();

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
    'should set emoji css class when message has text that is only emojis',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
        var message, _yield$renderMessageL24, getByTestId;

        return _regenerator.default.wrap(function _callee28$(_context28) {
          while (1) {
            switch ((_context28.prev = _context28.next)) {
              case 0:
                message = generateAliceMessage({
                  text: '🤖🤖🤖🤖',
                });
                _context28.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL24 = _context28.sent;
                getByTestId = _yield$renderMessageL24.getByTestId;
                expect(
                  getByTestId(messageLivestreamTextTestId).className,
                ).toContain('--is-emoji');

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
    'should trigger mentions hover handler when user hovers message text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
        var message,
          onMentionsHoverMessage,
          _yield$renderMessageL25,
          getByTestId;

        return _regenerator.default.wrap(function _callee29$(_context29) {
          while (1) {
            switch ((_context29.prev = _context29.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                onMentionsHoverMessage = jest.fn();
                _context29.next = 4;
                return renderMessageLivestream(message, {
                  onMentionsHoverMessage,
                });

              case 4:
                _yield$renderMessageL25 = _context29.sent;
                getByTestId = _yield$renderMessageL25.getByTestId;
                expect(onMentionsHoverMessage).not.toHaveBeenCalled();

                _react2.fireEvent.mouseOver(
                  getByTestId(messageLivestreamTextTestId),
                );

                expect(onMentionsHoverMessage).toHaveBeenCalledTimes(1);

              case 9:
              case 'end':
                return _context29.stop();
            }
          }
        }, _callee29);
      }),
    ),
  );
  it(
    'should trigger mentions click handler when user clicks message text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee30() {
        var message,
          onMentionsClickMessage,
          _yield$renderMessageL26,
          getByTestId;

        return _regenerator.default.wrap(function _callee30$(_context30) {
          while (1) {
            switch ((_context30.prev = _context30.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                onMentionsClickMessage = jest.fn();
                _context30.next = 4;
                return renderMessageLivestream(message, {
                  onMentionsClickMessage,
                });

              case 4:
                _yield$renderMessageL26 = _context30.sent;
                getByTestId = _yield$renderMessageL26.getByTestId;
                expect(onMentionsClickMessage).not.toHaveBeenCalled();

                _react2.fireEvent.click(
                  getByTestId(messageLivestreamTextTestId),
                );

                expect(onMentionsClickMessage).toHaveBeenCalledTimes(1);

              case 9:
              case 'end':
                return _context30.stop();
            }
          }
        }, _callee30);
      }),
    ),
  );
  it(
    'should render the message text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee31() {
        var text, message, _yield$renderMessageL27, getByText;

        return _regenerator.default.wrap(function _callee31$(_context31) {
          while (1) {
            switch ((_context31.prev = _context31.next)) {
              case 0:
                text = 'Hello world!';
                message = generateAliceMessage({
                  text,
                });
                _context31.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL27 = _context31.sent;
                getByText = _yield$renderMessageL27.getByText;
                expect(getByText(text)).toBeInTheDocument();

              case 7:
              case 'end':
                return _context31.stop();
            }
          }
        }, _callee31);
      }),
    ),
  );
  it(
    'should render message html when unsafeHTML is enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee32() {
        var customTestId, message, _yield$renderMessageL28, getByTestId;

        return _regenerator.default.wrap(function _callee32$(_context32) {
          while (1) {
            switch ((_context32.prev = _context32.next)) {
              case 0:
                customTestId = 'custom-test-id';
                message = generateAliceMessage({
                  html: '<h1 data-testid="'.concat(
                    customTestId,
                    '">Hello world</h1>',
                  ),
                });
                _context32.next = 4;
                return renderMessageLivestream(message, {
                  unsafeHTML: true,
                });

              case 4:
                _yield$renderMessageL28 = _context32.sent;
                getByTestId = _yield$renderMessageL28.getByTestId;
                expect(getByTestId(customTestId)).toBeInTheDocument();

              case 7:
              case 'end':
                return _context32.stop();
            }
          }
        }, _callee32);
      }),
    ),
  );
  it(
    'should display message error when message is of error type',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee33() {
        var errorMessage, message, _yield$renderMessageL29, getByTestId;

        return _regenerator.default.wrap(function _callee33$(_context33) {
          while (1) {
            switch ((_context33.prev = _context33.next)) {
              case 0:
                errorMessage = 'Unable to send it!';
                message = generateAliceMessage({
                  type: 'error',
                  text: errorMessage,
                });
                _context33.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL29 = _context33.sent;
                getByTestId = _yield$renderMessageL29.getByTestId;
                expect(getByTestId(messageLivestreamErrorTestId)).toContainHTML(
                  errorMessage,
                );

              case 7:
              case 'end':
                return _context33.stop();
            }
          }
        }, _callee33);
      }),
    ),
  );
  it(
    'should display command message error when command message is of error type',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee34() {
        var command, message, _yield$renderMessageL30, getByTestId;

        return _regenerator.default.wrap(function _callee34$(_context34) {
          while (1) {
            switch ((_context34.prev = _context34.next)) {
              case 0:
                command = 'giphy';
                message = generateAliceMessage({
                  type: 'error',
                  command,
                });
                _context34.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL30 = _context34.sent;
                getByTestId = _yield$renderMessageL30.getByTestId;
                expect(
                  getByTestId(messageLivestreamCommandErrorTestId),
                ).toContainHTML(
                  '<strong>/'.concat(
                    command,
                    '</strong> is not a valid command',
                  ),
                );

              case 7:
              case 'end':
                return _context34.stop();
            }
          }
        }, _callee34);
      }),
    ),
  );
  it(
    'should inform user that message can be retried when it fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee35() {
        var message, _yield$renderMessageL31, getByText;

        return _regenerator.default.wrap(function _callee35$(_context35) {
          while (1) {
            switch ((_context35.prev = _context35.next)) {
              case 0:
                message = generateAliceMessage({
                  status: 'failed',
                });
                _context35.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL31 = _context35.sent;
                getByText = _yield$renderMessageL31.getByText;
                expect(
                  getByText('Message failed. Click to try again.'),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context35.stop();
            }
          }
        }, _callee35);
      }),
    ),
  );
  it(
    'should render non-image attachment components when message no text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee36() {
        var message, _yield$renderMessageL32, queryAllByTestId;

        return _regenerator.default.wrap(function _callee36$(_context36) {
          while (1) {
            switch ((_context36.prev = _context36.next)) {
              case 0:
                message = generateAliceMessage({
                  attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
                  text: undefined,
                });
                _context36.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL32 = _context36.sent;
                queryAllByTestId = _yield$renderMessageL32.queryAllByTestId;
                expect(queryAllByTestId('attachment-file')).toHaveLength(3);

              case 6:
              case 'end':
                return _context36.stop();
            }
          }
        }, _callee36);
      }),
    ),
  );
  it(
    'should render image attachments in gallery',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee37() {
        var message, _yield$renderMessageL33, queryAllByTestId;

        return _regenerator.default.wrap(function _callee37$(_context37) {
          while (1) {
            switch ((_context37.prev = _context37.next)) {
              case 0:
                message = generateAliceMessage({
                  attachments: [
                    imageAttachment,
                    imageAttachment,
                    imageAttachment,
                  ],
                  text: undefined,
                });
                _context37.next = 3;
                return renderMessageLivestream(message);

              case 3:
                _yield$renderMessageL33 = _context37.sent;
                queryAllByTestId = _yield$renderMessageL33.queryAllByTestId;
                expect(queryAllByTestId('gallery-image')).toHaveLength(3);

              case 6:
              case 'end':
                return _context37.stop();
            }
          }
        }, _callee37);
      }),
    ),
  );
  it(
    'should display the reaction list',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee38() {
        var bobReaction, message, _yield$renderMessageL34, getByTestId;

        return _regenerator.default.wrap(function _callee38$(_context38) {
          while (1) {
            switch ((_context38.prev = _context38.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context38.next = 4;
                return renderMessageLivestream(message);

              case 4:
                _yield$renderMessageL34 = _context38.sent;
                getByTestId = _yield$renderMessageL34.getByTestId;
                expect(getByTestId('simple-reaction-list')).toBeInTheDocument();

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
    'should not display the reaction list if disabled in channel config',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee39() {
        var bobReaction, message, _yield$renderMessageL35, queryByTestId;

        return _regenerator.default.wrap(function _callee39$(_context39) {
          while (1) {
            switch ((_context39.prev = _context39.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context39.next = 4;
                return renderMessageLivestream(
                  message,
                  {},
                  {
                    reactions: false,
                  },
                );

              case 4:
                _yield$renderMessageL35 = _context39.sent;
                queryByTestId = _yield$renderMessageL35.queryByTestId;
                expect(queryByTestId('simple-reaction-list')).toBeNull();

              case 7:
              case 'end':
                return _context39.stop();
            }
          }
        }, _callee39);
      }),
    ),
  );
  it(
    'should display a message reply button when not on a thread and message has replies',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee40() {
        var message, _yield$renderMessageL36, getByTestId;

        return _regenerator.default.wrap(function _callee40$(_context40) {
          while (1) {
            switch ((_context40.prev = _context40.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                _context40.next = 3;
                return renderMessageLivestream(message, {
                  initialMessage: false,
                });

              case 3:
                _yield$renderMessageL36 = _context40.sent;
                getByTestId = _yield$renderMessageL36.getByTestId;
                expect(getByTestId('replies-count-button')).toBeInTheDocument();

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
    'should handle open thread when message has replies reply button is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee41() {
        var message, handleOpenThread, _yield$renderMessageL37, getByTestId;

        return _regenerator.default.wrap(function _callee41$(_context41) {
          while (1) {
            switch ((_context41.prev = _context41.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                handleOpenThread = jest.fn();
                _context41.next = 4;
                return renderMessageLivestream(message, {
                  initialMessage: false,
                  handleOpenThread,
                });

              case 4:
                _yield$renderMessageL37 = _context41.sent;
                getByTestId = _yield$renderMessageL37.getByTestId;
                expect(handleOpenThread).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId('replies-count-button'));

                expect(handleOpenThread).toHaveBeenCalledTimes(1);

              case 9:
              case 'end':
                return _context41.stop();
            }
          }
        }, _callee41);
      }),
    ),
  );
});
