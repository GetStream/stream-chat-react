'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _context23 = require('../../../context');

var _MessageText = _interopRequireDefault(require('../MessageText'));

var _MessageOptions = _interopRequireDefault(require('../MessageOptions'));

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
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});
var onMentionsHoverMock = jest.fn();
var onMentionsClickMock = jest.fn();
var defaultProps = {
  message: (0, _mockBuilders.generateMessage)(),
  initialMessage: false,
  threadList: false,
  messageWrapperRef: {
    current: document.createElement('div'),
  },
  onReactionListClick: function onReactionListClick() {},
};

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

function renderMessageText(_x) {
  return _renderMessageText.apply(this, arguments);
}

function _renderMessageText() {
  _renderMessageText = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee22(customProps) {
      var channelConfig,
        renderer,
        client,
        channel,
        customDateTimeParser,
        _args22 = arguments;
      return _regenerator.default.wrap(function _callee22$(_context22) {
        while (1) {
          switch ((_context22.prev = _context22.next)) {
            case 0:
              channelConfig =
                _args22.length > 1 && _args22[1] !== undefined
                  ? _args22[1]
                  : {};
              renderer =
                _args22.length > 2 && _args22[2] !== undefined
                  ? _args22[2]
                  : _react2.render;
              _context22.next = 4;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 4:
              client = _context22.sent;
              channel = (0, _mockBuilders.generateChannel)({
                getConfig: function getConfig() {
                  return _objectSpread(
                    {
                      reactions: true,
                    },
                    channelConfig,
                  );
                },
              });
              customDateTimeParser = jest.fn(function () {
                return {
                  format: jest.fn(),
                };
              });
              return _context22.abrupt(
                'return',
                renderer(
                  /*#__PURE__*/ _react.default.createElement(
                    _context23.ChannelContext.Provider,
                    {
                      value: {
                        channel,
                        client,
                        emojiConfig: _mockBuilders.emojiMockConfig,
                        onMentionsHover: onMentionsHoverMock,
                        onMentionsClick: onMentionsClickMock,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context23.TranslationContext.Provider,
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
                        _MessageText.default,
                        (0, _extends2.default)({}, defaultProps, customProps),
                      ),
                      ' ',
                    ),
                  ),
                ),
              );

            case 8:
            case 'end':
              return _context22.stop();
          }
        }
      }, _callee22);
    }),
  );
  return _renderMessageText.apply(this, arguments);
}

var messageTextTestId = 'message-text-inner-wrapper';
var reactionSelectorTestId = 'reaction-selector';
describe('<MessageText />', function () {
  beforeEach(jest.clearAllMocks);
  it(
    'should not render anything if message is not set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _yield$renderMessageT, queryByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderMessageText({
                  message: undefined,
                });

              case 2:
                _yield$renderMessageT = _context.sent;
                queryByTestId = _yield$renderMessageT.queryByTestId;
                expect(queryByTestId(messageTextTestId)).toBeNull();

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should not render anything if message text is not set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _yield$renderMessageT2, queryByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return renderMessageText({
                  message: undefined,
                });

              case 2:
                _yield$renderMessageT2 = _context2.sent;
                queryByTestId = _yield$renderMessageT2.queryByTestId;
                expect(queryByTestId(messageTextTestId)).toBeNull();

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should set attachments css class modifier when message has text and is focused',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var attachment, message, _yield$renderMessageT3, getByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                attachment = {
                  type: 'image',
                  image_url: 'image.jpg',
                };
                message = generateAliceMessage({
                  attachments: [attachment, attachment, attachment],
                });
                _context3.next = 4;
                return renderMessageText({
                  message,
                });

              case 4:
                _yield$renderMessageT3 = _context3.sent;
                getByTestId = _yield$renderMessageT3.getByTestId;
                expect(getByTestId(messageTextTestId).className).toContain(
                  '--has-attachment',
                );

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
    'should set emoji css class when message has text that is only emojis',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var message, _yield$renderMessageT4, getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = generateAliceMessage({
                  text: '🤖🤖🤖🤖',
                });
                _context4.next = 3;
                return renderMessageText({
                  message,
                });

              case 3:
                _yield$renderMessageT4 = _context4.sent;
                getByTestId = _yield$renderMessageT4.getByTestId;
                expect(getByTestId(messageTextTestId).className).toContain(
                  '--is-emoji',
                );

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should handle message mention mouse hover event',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var message, _yield$renderMessageT5, getByTestId;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                _context5.next = 3;
                return renderMessageText({
                  message,
                });

              case 3:
                _yield$renderMessageT5 = _context5.sent;
                getByTestId = _yield$renderMessageT5.getByTestId;
                expect(onMentionsHoverMock).not.toHaveBeenCalled();

                _react2.fireEvent.mouseOver(getByTestId(messageTextTestId));

                expect(onMentionsHoverMock).toHaveBeenCalledTimes(1);

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
    'should handle custom message mention mouse hover event',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var message, customMentionsHover, _yield$renderMessageT6, getByTestId;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                customMentionsHover = jest.fn();
                _context6.next = 4;
                return renderMessageText({
                  message,
                  onMentionsHoverMessage: customMentionsHover,
                });

              case 4:
                _yield$renderMessageT6 = _context6.sent;
                getByTestId = _yield$renderMessageT6.getByTestId;
                expect(customMentionsHover).not.toHaveBeenCalled();

                _react2.fireEvent.mouseOver(getByTestId(messageTextTestId));

                expect(customMentionsHover).toHaveBeenCalledTimes(1);

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
    'should handle message mention mouse click event',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var message, _yield$renderMessageT7, getByTestId;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                _context7.next = 3;
                return renderMessageText({
                  message,
                });

              case 3:
                _yield$renderMessageT7 = _context7.sent;
                getByTestId = _yield$renderMessageT7.getByTestId;
                expect(onMentionsClickMock).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId(messageTextTestId));

                expect(onMentionsClickMock).toHaveBeenCalledTimes(1);

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
    'should handle custom message mention mouse click event',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var message, customMentionClick, _yield$renderMessageT8, getByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                message = generateAliceMessage({
                  mentioned_users: [bob],
                });
                customMentionClick = jest.fn();
                _context8.next = 4;
                return renderMessageText({
                  message,
                  onMentionsClickMessage: customMentionClick,
                });

              case 4:
                _yield$renderMessageT8 = _context8.sent;
                getByTestId = _yield$renderMessageT8.getByTestId;
                expect(customMentionClick).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId(messageTextTestId));

                expect(customMentionClick).toHaveBeenCalledTimes(1);

              case 9:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should inform that message was not sent when message is has type "error"',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var message, _yield$renderMessageT9, getByText;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                message = generateAliceMessage({
                  type: 'error',
                });
                _context9.next = 3;
                return renderMessageText({
                  message,
                });

              case 3:
                _yield$renderMessageT9 = _context9.sent;
                getByText = _yield$renderMessageT9.getByText;
                expect(getByText('Error · Unsent')).toBeInTheDocument();

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
    'should inform that retry is possible when message has status "failed"',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var message, _yield$renderMessageT10, getByText;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                message = generateAliceMessage({
                  status: 'failed',
                });
                _context10.next = 3;
                return renderMessageText({
                  message,
                });

              case 3:
                _yield$renderMessageT10 = _context10.sent;
                getByText = _yield$renderMessageT10.getByText;
                expect(
                  getByText('Message Failed · Click to try again'),
                ).toBeInTheDocument();

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
    'render message html when unsafe html property is enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var message, _yield$renderMessageT11, getByTestId;

        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                message = generateAliceMessage({
                  html: '<span data-testid="custom-html" />',
                });
                _context11.next = 3;
                return renderMessageText({
                  message,
                  unsafeHTML: true,
                });

              case 3:
                _yield$renderMessageT11 = _context11.sent;
                getByTestId = _yield$renderMessageT11.getByTestId;
                expect(getByTestId('custom-html')).toBeInTheDocument();

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
    'render message text',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var text, message, _yield$renderMessageT12, getByText;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                text = 'Hello, world!';
                message = generateAliceMessage({
                  text,
                });
                _context12.next = 4;
                return renderMessageText({
                  message,
                });

              case 4:
                _yield$renderMessageT12 = _context12.sent;
                getByText = _yield$renderMessageT12.getByText;
                expect(getByText(text)).toBeInTheDocument();

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
    'should display text in users set language',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var text, message, _yield$renderMessageT13, getByText;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                text = 'bonjour';
                message = generateAliceMessage({
                  text,
                  i18n: {
                    fr_text: 'bonjour',
                    en_text: 'hello',
                    language: 'fr',
                  },
                });
                _context13.next = 4;
                return renderMessageText({
                  message,
                });

              case 4:
                _yield$renderMessageT13 = _context13.sent;
                getByText = _yield$renderMessageT13.getByText;
                expect(getByText('hello')).toBeInTheDocument();

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
    'should show reaction list if message has reactions and detailed reactions are not displayed',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
        var bobReaction, message, _yield$renderMessageT14, getByTestId;

        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch ((_context14.prev = _context14.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context14.next = 4;
                return renderMessageText({
                  message,
                });

              case 4:
                _yield$renderMessageT14 = _context14.sent;
                getByTestId = _yield$renderMessageT14.getByTestId;
                expect(getByTestId('reaction-list')).toBeInTheDocument();

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
    'should not show reaction list if disabled in channelConfig',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
        var bobReaction, message, _yield$renderMessageT15, queryByTestId;

        return _regenerator.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch ((_context15.prev = _context15.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context15.next = 4;
                return renderMessageText(
                  {
                    message,
                  },
                  {
                    reactions: false,
                  },
                );

              case 4:
                _yield$renderMessageT15 = _context15.sent;
                queryByTestId = _yield$renderMessageT15.queryByTestId;
                expect(queryByTestId('reaction-list')).toBeNull();

              case 7:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15);
      }),
    ),
  );
  it(
    'should show reaction selector when message has reaction and reaction list is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
        var bobReaction,
          message,
          _yield$renderMessageT16,
          getByTestId,
          queryByTestId;

        return _regenerator.default.wrap(function _callee16$(_context16) {
          while (1) {
            switch ((_context16.prev = _context16.next)) {
              case 0:
                bobReaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = generateAliceMessage({
                  latest_reactions: [bobReaction],
                });
                _context16.next = 4;
                return renderMessageText({
                  message,
                });

              case 4:
                _yield$renderMessageT16 = _context16.sent;
                getByTestId = _yield$renderMessageT16.getByTestId;
                queryByTestId = _yield$renderMessageT16.queryByTestId;
                expect(queryByTestId(reactionSelectorTestId)).toBeNull();

                _react2.fireEvent.click(getByTestId('reaction-list'));

                expect(getByTestId(reactionSelectorTestId)).toBeInTheDocument();

              case 10:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16);
      }),
    ),
  );
  it(
    'should render message options',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
        return _regenerator.default.wrap(function _callee17$(_context17) {
          while (1) {
            switch ((_context17.prev = _context17.next)) {
              case 0:
                _context17.next = 2;
                return renderMessageText();

              case 2:
                expect(_MessageOptions.default).toHaveBeenCalledTimes(1);

              case 3:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17);
      }),
    ),
  );
  it(
    'should render message options with custom props when those are set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
        var displayLeft;
        return _regenerator.default.wrap(function _callee18$(_context18) {
          while (1) {
            switch ((_context18.prev = _context18.next)) {
              case 0:
                displayLeft = false;
                _context18.next = 3;
                return renderMessageText({
                  customOptionProps: {
                    displayLeft,
                  },
                });

              case 3:
                expect(_MessageOptions.default).toHaveBeenCalledWith(
                  expect.objectContaining({
                    displayLeft,
                  }),
                  {},
                );

              case 4:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18);
      }),
    ),
  );
  it(
    'should render with a custom wrapper class when one is set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
        var customWrapperClass, message, tree;
        return _regenerator.default.wrap(function _callee19$(_context19) {
          while (1) {
            switch ((_context19.prev = _context19.next)) {
              case 0:
                customWrapperClass = 'custom-wrapper';
                message = (0, _mockBuilders.generateMessage)({
                  text: 'hello world',
                });
                _context19.next = 4;
                return renderMessageText(
                  {
                    message,
                    customWrapperClass,
                  },
                  {},
                  _reactTestRenderer.default.create,
                );

              case 4:
                tree = _context19.sent;
                expect(tree.toJSON()).toMatchInlineSnapshot(
                  '\n      Array [\n        <div\n          className="custom-wrapper"\n        >\n          <div\n            className="str-chat__message-text-inner str-chat__message-simple-text-inner"\n            data-testid="message-text-inner-wrapper"\n            onClick={[Function]}\n            onMouseOver={[Function]}\n          >\n            <div\n              onClick={[Function]}\n            >\n              <p>\n                hello world\n              </p>\n            </div>\n          </div>\n          <div />\n        </div>,\n        " ",\n      ]\n    ',
                );

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
    'should render with a custom inner class when one is set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
        var customInnerClass, message, tree;
        return _regenerator.default.wrap(function _callee20$(_context20) {
          while (1) {
            switch ((_context20.prev = _context20.next)) {
              case 0:
                customInnerClass = 'custom-inner';
                message = (0, _mockBuilders.generateMessage)({
                  text: 'hi mate',
                });
                _context20.next = 4;
                return renderMessageText(
                  {
                    message,
                    customInnerClass,
                  },
                  {},
                  _reactTestRenderer.default.create,
                );

              case 4:
                tree = _context20.sent;
                expect(tree.toJSON()).toMatchInlineSnapshot(
                  '\n      Array [\n        <div\n          className="str-chat__message-text"\n        >\n          <div\n            className="custom-inner"\n            data-testid="message-text-inner-wrapper"\n            onClick={[Function]}\n            onMouseOver={[Function]}\n          >\n            <div\n              onClick={[Function]}\n            >\n              <p>\n                hi mate\n              </p>\n            </div>\n          </div>\n          <div />\n        </div>,\n        " ",\n      ]\n    ',
                );

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
    'should render with custom theme identifier in generated css classes when theme is set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
        var message, tree;
        return _regenerator.default.wrap(function _callee21$(_context21) {
          while (1) {
            switch ((_context21.prev = _context21.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)({
                  text: 'whatup?!',
                });
                _context21.next = 3;
                return renderMessageText(
                  {
                    message,
                    theme: 'custom',
                  },
                  {},
                  _reactTestRenderer.default.create,
                );

              case 3:
                tree = _context21.sent;
                expect(tree.toJSON()).toMatchInlineSnapshot(
                  '\n      Array [\n        <div\n          className="str-chat__message-text"\n        >\n          <div\n            className="str-chat__message-text-inner str-chat__message-custom-text-inner"\n            data-testid="message-text-inner-wrapper"\n            onClick={[Function]}\n            onMouseOver={[Function]}\n          >\n            <div\n              onClick={[Function]}\n            >\n              <p>\n                whatup?!\n              </p>\n            </div>\n          </div>\n          <div />\n        </div>,\n        " ",\n      ]\n    ',
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
});
