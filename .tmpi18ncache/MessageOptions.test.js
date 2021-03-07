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

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _context16 = require('../../../context');

var _MessageActions = require('../../MessageActions');

var _utils = require('../utils');

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

jest.mock('../../MessageActions', function () {
  return {
    MessageActions: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var defaultProps = {
  message: (0, _mockBuilders.generateMessage)(),
  initialMessage: false,
  threadList: false,
  messageWrapperRef: {
    current: document.createElement('div'),
  },
  onReactionListClick: function onReactionListClick() {},
  getMessageActions: function getMessageActions() {
    return Object.keys(_utils.MESSAGE_ACTIONS);
  },
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

function renderMessageOptions(_x, _x2) {
  return _renderMessageOptions.apply(this, arguments);
}

function _renderMessageOptions() {
  _renderMessageOptions = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee15(
      customProps,
      channelConfig,
    ) {
      var client, channel;
      return _regenerator.default.wrap(function _callee15$(_context15) {
        while (1) {
          switch ((_context15.prev = _context15.next)) {
            case 0:
              _context15.next = 2;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 2:
              client = _context15.sent;
              channel = (0, _mockBuilders.generateChannel)({
                getConfig: function getConfig() {
                  return channelConfig;
                },
              });
              return _context15.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context16.ChannelContext.Provider,
                    {
                      value: {
                        channel,
                        client,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _MessageOptions.default,
                      (0, _extends2.default)({}, defaultProps, customProps),
                    ),
                  ),
                ),
              );

            case 5:
            case 'end':
              return _context15.stop();
          }
        }
      }, _callee15);
    }),
  );
  return _renderMessageOptions.apply(this, arguments);
}

var threadActionTestId = 'thread-action';
var reactionActionTestId = 'message-reaction-action';
var messageOptionsTestId = 'message-options';
describe('<MessageOptions />', function () {
  beforeEach(jest.clearAllMocks);
  it(
    'should not render message options when there is no message set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _yield$renderMessageO, queryByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderMessageOptions({
                  message: undefined,
                });

              case 2:
                _yield$renderMessageO = _context.sent;
                queryByTestId = _yield$renderMessageO.queryByTestId;
                expect(queryByTestId(/message-options/)).toBeNull();

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
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
    'should not render message options when message is of %s %s and is from current user.',
    /*#__PURE__*/ (function () {
      var _ref2 = (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee2(key, value) {
          var message, _yield$renderMessageO2, queryByTestId;

          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch ((_context2.prev = _context2.next)) {
                case 0:
                  message = generateAliceMessage({
                    [key]: value,
                  });
                  _context2.next = 3;
                  return renderMessageOptions({
                    message,
                  });

                case 3:
                  _yield$renderMessageO2 = _context2.sent;
                  queryByTestId = _yield$renderMessageO2.queryByTestId;
                  expect(queryByTestId(/message-options/)).toBeNull();

                case 6:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2);
        }),
      );

      return function (_x3, _x4) {
        return _ref2.apply(this, arguments);
      };
    })(),
  );
  it(
    'should not render message options when it is parent message in a thread',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var _yield$renderMessageO3, queryByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.next = 2;
                return renderMessageOptions({
                  initialMessage: true,
                });

              case 2:
                _yield$renderMessageO3 = _context3.sent;
                queryByTestId = _yield$renderMessageO3.queryByTestId;
                expect(queryByTestId(/message-options/)).toBeNull();

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should display thread actions when message is not displayed on a thread list and channel has replies configured',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var _yield$renderMessageO4, getByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                _context4.next = 2;
                return renderMessageOptions(defaultProps, {
                  replies: true,
                });

              case 2:
                _yield$renderMessageO4 = _context4.sent;
                getByTestId = _yield$renderMessageO4.getByTestId;
                expect(getByTestId(threadActionTestId)).toBeInTheDocument();

              case 5:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  it(
    'should not display thread actions when message is in a thread list',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var _yield$renderMessageO5, queryByTestId;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                _context5.next = 2;
                return renderMessageOptions(
                  {
                    threadList: true,
                  },
                  {
                    replies: true,
                  },
                );

              case 2:
                _yield$renderMessageO5 = _context5.sent;
                queryByTestId = _yield$renderMessageO5.queryByTestId;
                expect(queryByTestId(threadActionTestId)).toBeNull();

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5);
      }),
    ),
  );
  it(
    'should not display thread actions when channel does not have replies enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var _yield$renderMessageO6, queryByTestId;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                _context6.next = 2;
                return renderMessageOptions(
                  {},
                  {
                    replies: false,
                  },
                );

              case 2:
                _yield$renderMessageO6 = _context6.sent;
                queryByTestId = _yield$renderMessageO6.queryByTestId;
                expect(queryByTestId(threadActionTestId)).toBeNull();

              case 5:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
  it(
    'should trigger open thread handler when custom thread action is set and thread action is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var handleOpenThread, message, _yield$renderMessageO7, getByTestId;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                handleOpenThread = jest.fn(function () {});
                message = (0, _mockBuilders.generateMessage)();
                _context7.next = 4;
                return renderMessageOptions(
                  {
                    threadList: false,
                    handleOpenThread,
                    message,
                  },
                  {
                    replies: true,
                  },
                );

              case 4:
                _yield$renderMessageO7 = _context7.sent;
                getByTestId = _yield$renderMessageO7.getByTestId;
                expect(handleOpenThread).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId(threadActionTestId));

                expect(handleOpenThread).toHaveBeenCalledTimes(1);

              case 9:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should display reactions action when channel has reactions enabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var _yield$renderMessageO8, getByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                _context8.next = 2;
                return renderMessageOptions(
                  {},
                  {
                    reactions: true,
                  },
                );

              case 2:
                _yield$renderMessageO8 = _context8.sent;
                getByTestId = _yield$renderMessageO8.getByTestId;
                expect(getByTestId(reactionActionTestId)).toBeInTheDocument();

              case 5:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should not display reactions action when channel has reactions disabled',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var _yield$renderMessageO9, queryByTestId;

        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                _context9.next = 2;
                return renderMessageOptions(
                  {},
                  {
                    reactions: false,
                  },
                );

              case 2:
                _yield$renderMessageO9 = _context9.sent;
                queryByTestId = _yield$renderMessageO9.queryByTestId;
                expect(queryByTestId(reactionActionTestId)).toBeNull();

              case 5:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should trigger reaction list click when reaction action is clicked',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var opentReationList, _yield$renderMessageO10, getByTestId;

        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                opentReationList = jest.fn();
                _context10.next = 3;
                return renderMessageOptions(
                  {
                    onReactionListClick: opentReationList,
                  },
                  {
                    reactions: true,
                  },
                );

              case 3:
                _yield$renderMessageO10 = _context10.sent;
                getByTestId = _yield$renderMessageO10.getByTestId;
                expect(opentReationList).not.toHaveBeenCalled();

                _react2.fireEvent.click(getByTestId(reactionActionTestId));

                expect(opentReationList).toHaveBeenCalledTimes(1);

              case 8:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it(
    'should render message actions',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                _context11.next = 2;
                return renderMessageOptions();

              case 2:
                expect(_MessageActions.MessageActions).toHaveBeenCalledWith(
                  expect.objectContaining(defaultProps),
                  {},
                );

              case 3:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11);
      }),
    ),
  );
  it(
    'should not render message with "left-to-the-bubble" style if displayLeft is false',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
        var message, _yield$renderMessageO11, queryByTestId;

        return _regenerator.default.wrap(function _callee12$(_context12) {
          while (1) {
            switch ((_context12.prev = _context12.next)) {
              case 0:
                message = generateAliceMessage();
                _context12.next = 3;
                return renderMessageOptions({
                  message,
                  displayLeft: false,
                });

              case 3:
                _yield$renderMessageO11 = _context12.sent;
                queryByTestId = _yield$renderMessageO11.queryByTestId;
                expect(queryByTestId('message-options-left')).toBeNull();

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
    'should not render message thread actinos if displayReplies is false',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
        var _yield$renderMessageO12, queryByTestId;

        return _regenerator.default.wrap(function _callee13$(_context13) {
          while (1) {
            switch ((_context13.prev = _context13.next)) {
              case 0:
                _context13.next = 2;
                return renderMessageOptions(
                  {
                    displayReplies: false,
                  },
                  {
                    replies: true,
                  },
                );

              case 2:
                _yield$renderMessageO12 = _context13.sent;
                queryByTestId = _yield$renderMessageO12.queryByTestId;
                expect(queryByTestId(threadActionTestId)).toBeNull();

              case 5:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13);
      }),
    ),
  );
  it(
    'should render css classes with corresonding theme when it is set',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
        var _yield$renderMessageO13, queryByTestId;

        return _regenerator.default.wrap(function _callee14$(_context14) {
          while (1) {
            switch ((_context14.prev = _context14.next)) {
              case 0:
                _context14.next = 2;
                return renderMessageOptions(
                  {
                    theme: 'custom',
                  },
                  {
                    reactions: true,
                  },
                );

              case 2:
                _yield$renderMessageO13 = _context14.sent;
                queryByTestId = _yield$renderMessageO13.queryByTestId;
                expect(queryByTestId(messageOptionsTestId).className).toContain(
                  'str-chat__message-custom__actions',
                );
                expect(queryByTestId(reactionActionTestId).className).toContain(
                  'str-chat__message-custom__actions__action',
                );

              case 6:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14);
      }),
    ),
  );
});
