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

var _context32 = require('../../../context');

var _MessageCommerce = _interopRequireDefault(require('../MessageCommerce'));

var _Avatar = require('../../Avatar');

var _MML = require('../../MML');

var _MessageText = _interopRequireDefault(require('../MessageText'));

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
jest.mock('../../MML', function () {
  return {
    MML: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
jest.mock('../MessageText', function () {
  return jest.fn(function () {
    return /*#__PURE__*/ _react.default.createElement('div', null);
  });
});
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
  image: 'alice-avatar.jpg',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
  image: 'bob-avatar.jpg',
});
var openThreadMock = jest.fn();

function renderMessageCommerce(_x) {
  return _renderMessageCommerce.apply(this, arguments);
}

function _renderMessageCommerce() {
  _renderMessageCommerce = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee31(message) {
      var props,
        channelConfig,
        channel,
        client,
        _args31 = arguments;
      return _regenerator.default.wrap(function _callee31$(_context31) {
        while (1) {
          switch ((_context31.prev = _context31.next)) {
            case 0:
              props =
                _args31.length > 1 && _args31[1] !== undefined
                  ? _args31[1]
                  : {};
              channelConfig =
                _args31.length > 2 && _args31[2] !== undefined
                  ? _args31[2]
                  : {
                      replies: true,
                    };
              channel = (0, _mockBuilders.generateChannel)({
                getConfig: function getConfig() {
                  return channelConfig;
                },
              });
              _context31.next = 5;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 5:
              client = _context31.sent;
              return _context31.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context32.ChannelContext.Provider,
                    {
                      value: {
                        channel,
                        client,
                        emojiConfig: _mockBuilders.emojiMockConfig,
                        openThread: openThreadMock,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _MessageCommerce.default,
                      (0, _extends2.default)(
                        {
                          message: message,
                          getMessageActions: function getMessageActions() {
                            return ['flag', 'mute', 'react', 'reply'];
                          },
                        },
                        props,
                      ),
                    ),
                  ),
                ),
              );

            case 7:
            case 'end':
              return _context31.stop();
          }
        }
      }, _callee31);
    }),
  );
  return _renderMessageCommerce.apply(this, arguments);
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

var pdfAttachment = {
  type: 'file',
  asset_url: 'file.pdf',
};
var imageAttachment = {
  type: 'image',
  image_url: 'image.jpg',
};
var messageCommerceWrapperTestId = 'message-commerce-wrapper';
var reactionSelectorTestId = 'reaction-selector';
var reactionListTestId = 'reaction-list';
var messageCommerceActionsTestId = 'message-reaction-action';
describe('<MessageCommerce />', function () {
  afterEach(_react2.cleanup);
  beforeEach(jest.clearAllMocks);
  it(
    'should not render anything if message is of type message.read',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var message, _yield$renderMessageC, container;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.read',
                });
                _context.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC = _context.sent;
                container = _yield$renderMessageC.container;
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
        var message, _yield$renderMessageC2, container;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'message.date',
                });
                _context2.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC2 = _context2.sent;
                container = _yield$renderMessageC2.container;
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
          _yield$renderMessageC3,
          getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                deletedMessage = generateAliceMessage({
                  deleted_at: new Date('2019-12-10T03:24:00'),
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
                return renderMessageCommerce(deletedMessage, {
                  MessageDeleted: CustomMessageDeletedComponent,
                });

              case 4:
                _yield$renderMessageC3 = _context3.sent;
                getByTestId = _yield$renderMessageC3.getByTestId;
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
          _yield$renderMessageC4,
          getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = generateBobMessage({
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
                return renderMessageCommerce(
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
                _yield$renderMessageC4 = _context4.sent;
                getByTestId = _yield$renderMessageC4.getByTestId;

                _react2.fireEvent.click(getByTestId('message-reaction-action'));

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
          _yield$renderMessageC5,
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
                return renderMessageCommerce(
                  message,
                  {
                    ReactionsList: CustomReactionsList,
                  },
                  {
                    reactions: true,
                  },
                );

              case 5:
                _yield$renderMessageC5 = _context5.sent;
                getByTestId = _yield$renderMessageC5.getByTestId;
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
        var message, CustomAvatar, _yield$renderMessageC6, getByTestId;

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
                return renderMessageCommerce(message, {
                  Avatar: CustomAvatar,
                  groupStyles: ['bottom'],
                });

              case 4:
                _yield$renderMessageC6 = _context6.sent;
                getByTestId = _yield$renderMessageC6.getByTestId;
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
    'should position message to the right if it is from current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var message, _yield$renderMessageC7, getByTestId;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                message = generateAliceMessage();
                _context7.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC7 = _context7.sent;
                getByTestId = _yield$renderMessageC7.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--right');

              case 6:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should position message to the left if it is not from current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var message, _yield$renderMessageC8, getByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                message = generateBobMessage();
                _context8.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC8 = _context8.sent;
                getByTestId = _yield$renderMessageC8.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--left');

              case 6:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should set correct css class modifier if message has text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message, _yield$renderMessageC9, getByTestId;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                message = generateAliceMessage({
                  text: 'Some text will go on this message',
                });
                _context9.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC9 = _context9.sent;
                getByTestId = _yield$renderMessageC9.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--has-text');

              case 6:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should set correct css class modifier if message has not text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message, _yield$renderMessageC10, getByTestId;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                _context10.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC10 = _context10.sent;
                getByTestId = _yield$renderMessageC10.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--has-no-text');

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
    'should set correct css class modifier if message has attachments',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var message, _yield$renderMessageC11, getByTestId;

        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                message = generateAliceMessage({
                  attachments: [pdfAttachment],
                });
                _context11.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC11 = _context11.sent;
                getByTestId = _yield$renderMessageC11.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--has-attachment');

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
    'should set correct css class modifier if message has reactions',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var bobReaction, message, _yield$renderMessageC12, getByTestId;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context12.next = 4;
                return renderMessageCommerce(message);

              case 4:
                _yield$renderMessageC12 = _context12.sent;
                getByTestId = _yield$renderMessageC12.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).toContain('--with-reactions');

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
    'should not set css class modifier if reactions is disabled in channel config',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var bobReaction, message, _yield$renderMessageC13, getByTestId;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context13.next = 4;
                return renderMessageCommerce(
                  message,
                  {},
                  {
                    reactions: false,
                  },
                );

              case 4:
                _yield$renderMessageC13 = _context13.sent;
                getByTestId = _yield$renderMessageC13.getByTestId;
                expect(
                  getByTestId(messageCommerceWrapperTestId).className,
                ).not.toContain('--with-reactions');

              case 7:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13);
      }),
    ),
  );
  it.each([['top'], ['bottom'], ['middle'], ['single']])(
    "should set correct css class modifier when message's first group style is %s",
    /*#__PURE__*/ (function () {
      var _ref15 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee14(modifier) {
          var message, _yield$renderMessageC14, getByTestId;

          return _regenerator.default.wrap(function _callee14$(_context14) {
            while (1) {
              switch ((_context14.prev = _context14.next)) {
                case 0:
                  message = generateAliceMessage();
                  _context14.next = 3;
                  return renderMessageCommerce(message, {
                    groupStyles: [modifier],
                  });

                case 3:
                  _yield$renderMessageC14 = _context14.sent;
                  getByTestId = _yield$renderMessageC14.getByTestId;
                  expect(
                    getByTestId(messageCommerceWrapperTestId).className,
                  ).toContain(modifier);

                case 6:
                case 'end':
                  return _context14.stop();
              }
            }
          }, _callee14);
        }),
      );

      return function (_x2) {
        return _ref15.apply(this, arguments);
      };
    })(),
  );
  it.each([
    [
      'should display',
      'bottom',
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
      'top',
      {
        shouldDisplay: false,
      },
    ],
    [
      'should not display',
      'middle',
      {
        shouldDisplay: false,
      },
    ],
  ])(
    '%s user avatar when group style is %s',
    /*#__PURE__*/ (function () {
      var _ref17 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee15(
          _,
          groupStyle,
          _ref16,
        ) {
          var shouldDisplay, message;
          return _regenerator.default.wrap(function _callee15$(_context15) {
            while (1) {
              switch ((_context15.prev = _context15.next)) {
                case 0:
                  shouldDisplay = _ref16.shouldDisplay;
                  message = generateAliceMessage();
                  _context15.next = 4;
                  return renderMessageCommerce(message, {
                    groupStyles: [groupStyle],
                  });

                case 4:
                  if (shouldDisplay) {
                    expect(_Avatar.Avatar).toHaveBeenCalledWith(
                      {
                        image: alice.image,
                        size: 32,
                        name: alice.name,
                        onClick: expect.any(Function),
                        onMouseOver: expect.any(Function),
                      },
                      {},
                    );
                  } else {
                    expect(_Avatar.Avatar).not.toHaveBeenCalled();
                  }

                case 5:
                case 'end':
                  return _context15.stop();
              }
            }
          }, _callee15);
        }),
      );

      return function (_x3, _x4, _x5) {
        return _ref17.apply(this, arguments);
      };
    })(),
  );
  it(
    'should not show the reaction list if reactions disabled in channel config',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
        var bobReaction, message, _yield$renderMessageC15, queryByTestId;

        return _regenerator.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch ((_context16.prev = _context16.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                  text: undefined,
                });
                _context16.next = 4;
                return renderMessageCommerce(
                  message,
                  {},
                  {
                    reactions: false,
                  },
                );

              case 4:
                _yield$renderMessageC15 = _context16.sent;
                queryByTestId = _yield$renderMessageC15.queryByTestId;
                expect(queryByTestId(reactionListTestId)).toBeNull();

              case 7:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16);
      }),
    ),
  );
  it(
    'should show the reaction list when message has no text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
        var bobReaction, message, _yield$renderMessageC16, getByTestId;

        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch ((_context17.prev = _context17.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                  text: undefined,
                });
                _context17.next = 4;
                return renderMessageCommerce(message);

              case 4:
                _yield$renderMessageC16 = _context17.sent;
                getByTestId = _yield$renderMessageC16.getByTestId;
                expect(getByTestId(reactionListTestId)).toBeInTheDocument();

              case 7:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17);
      }),
    ),
  );
  it(
    'should show the reaction selector when message has no text and user clicks on the reaction list',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
        var bobReaction,
          message,
          _yield$renderMessageC17,
          getByTestId,
          queryByTestId;

        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch ((_context18.prev = _context18.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                  text: undefined,
                });
                _context18.next = 4;
                return renderMessageCommerce(message);

              case 4:
                _yield$renderMessageC17 = _context18.sent;
                getByTestId = _yield$renderMessageC17.getByTestId;
                queryByTestId = _yield$renderMessageC17.queryByTestId;
                expect(queryByTestId(reactionSelectorTestId)).toBeNull();

                _react2.fireEvent.click(getByTestId(reactionListTestId));

                expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();

              case 10:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18);
      }),
    ),
  );
  it(
    'should render message actions when message has no text and channel has reactions enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
        var message, _yield$renderMessageC18, getByTestId;

        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch ((_context19.prev = _context19.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                _context19.next = 3;
                return renderMessageCommerce(
                  message,
                  {},
                  {
                    reactions: true,
                  },
                );

              case 3:
                _yield$renderMessageC18 = _context19.sent;
                getByTestId = _yield$renderMessageC18.getByTestId;
                expect(
                  getByTestId(messageCommerceActionsTestId),
                ).toBeInTheDocument();

              case 6:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19);
      }),
    ),
  );
  it(
    'should not render message actions when message has no text and channel has reactions disabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
        var message, _yield$renderMessageC19, queryByTestId;

        return _regenerator.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch ((_context20.prev = _context20.next)) {
              case 0:
                message = generateAliceMessage({
                  text: undefined,
                });
                _context20.next = 3;
                return renderMessageCommerce(
                  message,
                  {},
                  {
                    reactions: false,
                  },
                );

              case 3:
                _yield$renderMessageC19 = _context20.sent;
                queryByTestId = _yield$renderMessageC19.queryByTestId;
                expect(queryByTestId(messageCommerceActionsTestId)).toBeNull();

              case 6:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20);
      }),
    ),
  );
  it(
    'should render MML',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
        var mml, message;
        return _regenerator.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch ((_context21.prev = _context21.next)) {
              case 0:
                mml = '<mml>text</mml>';
                message = generateAliceMessage({
                  mml,
                });
                _context21.next = 4;
                return renderMessageCommerce(message);

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
                return _context21.stop();
            }
          }
        }, _callee21);
      }),
    ),
  );
  it(
    'should render MML on left for others',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee22() {
        var mml, message;
        return _regenerator.default.wrap(function _callee22$(_context22) {
          while (1) {
            switch ((_context22.prev = _context22.next)) {
              case 0:
                mml = '<mml>text</mml>';
                message = generateBobMessage({
                  mml,
                });
                _context22.next = 4;
                return renderMessageCommerce(message);

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
                return _context22.stop();
            }
          }
        }, _callee22);
      }),
    ),
  );
  it.each([
    ['type', 'error'],
    ['type', 'system'],
    ['type', 'ephemeral'],
    ['status', 'sending'],
    ['status', 'failed'],
  ])(
    'should not render message actions when message has %s %s',
    /*#__PURE__*/ (function () {
      var _ref25 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee23(key, value) {
          var message, _yield$renderMessageC20, queryByTestId;

          return _regenerator.default.wrap(function _callee23$(_context23) {
            while (1) {
              switch ((_context23.prev = _context23.next)) {
                case 0:
                  message = generateAliceMessage({
                    [key]: value,
                    text: undefined,
                  });
                  _context23.next = 3;
                  return renderMessageCommerce(message, {
                    reactions: true,
                  });

                case 3:
                  _yield$renderMessageC20 = _context23.sent;
                  queryByTestId = _yield$renderMessageC20.queryByTestId;
                  expect(
                    queryByTestId(messageCommerceActionsTestId),
                  ).toBeNull();

                case 6:
                case 'end':
                  return _context23.stop();
              }
            }
          }, _callee23);
        }),
      );

      return function (_x6, _x7) {
        return _ref25.apply(this, arguments);
      };
    })(),
  );
  it(
    'should render non-image attachment components when message no text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee24() {
        var message, _yield$renderMessageC21, queryAllByTestId;

        return _regenerator.default.wrap(function _callee24$(_context24) {
          while (1) {
            switch ((_context24.prev = _context24.next)) {
              case 0:
                message = generateAliceMessage({
                  attachments: [pdfAttachment, pdfAttachment, pdfAttachment],
                  text: undefined,
                });
                _context24.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC21 = _context24.sent;
                queryAllByTestId = _yield$renderMessageC21.queryAllByTestId;
                expect(queryAllByTestId('attachment-file')).toHaveLength(3);

              case 6:
              case 'end':
                return _context24.stop();
            }
          }
        }, _callee24);
      }),
    ),
  );
  it(
    'should render image attachments in gallery when message has no text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
        var message, _yield$renderMessageC22, queryAllByTestId;

        return _regenerator.default.wrap(function _callee25$(_context25) {
          while (1) {
            switch ((_context25.prev = _context25.next)) {
              case 0:
                message = generateAliceMessage({
                  attachments: [
                    imageAttachment,
                    imageAttachment,
                    imageAttachment,
                  ],
                  text: undefined,
                });
                _context25.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC22 = _context25.sent;
                queryAllByTestId = _yield$renderMessageC22.queryAllByTestId;
                expect(queryAllByTestId('gallery-image')).toHaveLength(3);

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
    'should render message text when message has text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
        var message;
        return _regenerator.default.wrap(function _callee26$(_context26) {
          while (1) {
            switch ((_context26.prev = _context26.next)) {
              case 0:
                message = generateAliceMessage({
                  text: 'Hello',
                });
                _context26.next = 3;
                return renderMessageCommerce(message);

              case 3:
                expect(_MessageText.default).toHaveBeenCalledWith(
                  expect.objectContaining({
                    message,
                    customOptionProps: expect.objectContaining({
                      displayLeft: false,
                      displayReplies: false,
                      displayActions: false,
                      theme: 'commerce',
                    }),
                    theme: 'commerce',
                    customWrapperClass: 'str-chat__message-commerce-text',
                  }),
                  {},
                );

              case 4:
              case 'end':
                return _context26.stop();
            }
          }
        }, _callee26);
      }),
    ),
  );
  it(
    'should display reply count when message is not on thread list',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
        var message, _yield$renderMessageC23, getByTestId;

        return _regenerator.default.wrap(function _callee27$(_context27) {
          while (1) {
            switch ((_context27.prev = _context27.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                _context27.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC23 = _context27.sent;
                getByTestId = _yield$renderMessageC23.getByTestId;
                expect(getByTestId('replies-count-button')).toBeInTheDocument();

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
    'should open thread when message is not on a thread list and user click on the message replies count',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
        var message, _yield$renderMessageC24, getByTestId;

        return _regenerator.default.wrap(function _callee28$(_context28) {
          while (1) {
            switch ((_context28.prev = _context28.next)) {
              case 0:
                message = generateAliceMessage({
                  reply_count: 1,
                });
                _context28.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC24 = _context28.sent;
                getByTestId = _yield$renderMessageC24.getByTestId;
                expect(openThreadMock).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId('replies-count-button'));

                expect(openThreadMock).toHaveBeenCalledWith(
                  message,
                  expect.any(Object), // The Event object
                );

              case 8:
              case 'end':
                return _context28.stop();
            }
          }
        }, _callee28);
      }),
    ),
  );
  it(
    'should display user name when message is not from current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
        var message, _yield$renderMessageC25, getByText;

        return _regenerator.default.wrap(function _callee29$(_context29) {
          while (1) {
            switch ((_context29.prev = _context29.next)) {
              case 0:
                message = generateBobMessage();
                _context29.next = 3;
                return renderMessageCommerce(message);

              case 3:
                _yield$renderMessageC25 = _context29.sent;
                getByText = _yield$renderMessageC25.getByText;
                expect(getByText(bob.name)).toBeInTheDocument();

              case 6:
              case 'end':
                return _context29.stop();
            }
          }
        }, _callee29);
      }),
    ),
  );
  it(
    "should display message's timestamp with time only format",
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee30() {
        var messageDate,
          parsedDateText,
          message,
          format,
          customTDateTimeParser,
          _yield$renderMessageC26,
          getByText;

        return _regenerator.default.wrap(function _callee30$(_context30) {
          while (1) {
            switch ((_context30.prev = _context30.next)) {
              case 0:
                messageDate = new Date('2019-12-25T01:00:00');
                parsedDateText = '01:00:00';
                message = generateAliceMessage({
                  created_at: messageDate,
                });
                format = jest.fn(function () {
                  return parsedDateText;
                });
                customTDateTimeParser = jest.fn(function () {
                  return {
                    format,
                  };
                });
                _context30.next = 7;
                return renderMessageCommerce(message, {
                  tDateTimeParser: customTDateTimeParser,
                });

              case 7:
                _yield$renderMessageC26 = _context30.sent;
                getByText = _yield$renderMessageC26.getByText;
                expect(customTDateTimeParser).toHaveBeenCalledWith(messageDate);
                expect(format).toHaveBeenCalledWith('LT');
                expect(getByText(parsedDateText)).toBeInTheDocument();

              case 12:
              case 'end':
                return _context30.stop();
            }
          }
        }, _callee30);
      }),
    ),
  );
});
