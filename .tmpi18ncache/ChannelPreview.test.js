'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
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

var _context9 = require('../../../context');

var _ChannelPreview = _interopRequireDefault(require('../ChannelPreview'));

var PreviewUIComponent = function PreviewUIComponent(props) {
  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'channel-id',
      },
      props.channel.id,
    ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'unread-count',
      },
      props.unread,
    ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'last-event-message',
      },
      props.lastMessage && props.lastMessage.text,
    ),
  );
};

var expectUnreadCountToBe = /*#__PURE__*/ (function () {
  var _ref = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee(
      getByTestId,
      expectedValue,
    ) {
      return _regenerator.default.wrap(function _callee$(_context) {
        while (1) {
          switch ((_context.prev = _context.next)) {
            case 0:
              _context.next = 2;
              return (0, _react2.waitFor)(function () {
                expect(getByTestId('unread-count')).toHaveTextContent(
                  expectedValue,
                );
              });

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee);
    }),
  );

  return function expectUnreadCountToBe(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

var expectLastEventMessageToBe = /*#__PURE__*/ (function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee2(
      getByTestId,
      expectedValue,
    ) {
      return _regenerator.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch ((_context2.prev = _context2.next)) {
            case 0:
              _context2.next = 2;
              return (0, _react2.waitFor)(function () {
                expect(getByTestId('last-event-message')).toHaveTextContent(
                  expectedValue,
                );
              });

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2);
    }),
  );

  return function expectLastEventMessageToBe(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

describe('ChannelPreview', function () {
  var chatClientUthred;
  var c0;
  var c1;

  var renderComponent = function renderComponent(props, renderer) {
    return renderer(
      /*#__PURE__*/ _react.default.createElement(
        _context9.ChatContext.Provider,
        {
          value: {
            client: chatClientUthred,
            setActiveChannel: function setActiveChannel() {
              return jest.fn();
            },
            channel: props.activeChannel,
          },
        },
        /*#__PURE__*/ _react.default.createElement(
          _ChannelPreview.default,
          (0, _extends2.default)(
            {
              Preview: PreviewUIComponent,
            },
            props,
          ),
        ),
      ),
    );
  };

  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var _yield$chatClientUthr, _yield$chatClientUthr2;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)({
                  id: 'uthred',
                });

              case 2:
                chatClientUthred = _context3.sent;
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([
                    (0, _mockBuilders.generateChannel)(),
                    (0, _mockBuilders.generateChannel)(),
                  ]),
                ]);
                _context3.next = 6;
                return chatClientUthred.queryChannels({}, {});

              case 6:
                _yield$chatClientUthr = _context3.sent;
                _yield$chatClientUthr2 = (0, _slicedToArray2.default)(
                  _yield$chatClientUthr,
                  2,
                );
                c0 = _yield$chatClientUthr2[0];
                c1 = _yield$chatClientUthr2[1];

              case 10:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  ); // eslint-disable-next-line jest/expect-expect

  it(
    'should mark channel as read, when set as active channel',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var _renderComponent, getByTestId, rerender;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                // Mock the countUnread function on channel, to return 10.
                c0.countUnread = function () {
                  return 10;
                };

                (_renderComponent = renderComponent(
                  {
                    channel: c0,
                    activeChannel: c1,
                  },
                  _react2.render,
                )),
                  (getByTestId = _renderComponent.getByTestId),
                  (rerender = _renderComponent.rerender); // Wait for list of channels to load in DOM.

                _context4.next = 4;
                return expectUnreadCountToBe(getByTestId, 10);

              case 4:
                renderComponent(
                  {
                    channel: c0,
                    activeChannel: c0,
                  },
                  rerender,
                );
                _context4.next = 7;
                return expectUnreadCountToBe(getByTestId, 0);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
  var eventCases = [
    ['message.new', _mockBuilders.dispatchMessageNewEvent],
    ['message.updated', _mockBuilders.dispatchMessageUpdatedEvent],
    ['message.deleted', _mockBuilders.dispatchMessageDeletedEvent],
  ];
  describe.each(eventCases)('On %s event', function (eventType, dispatcher) {
    it(
      'should update lastMessage',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
          var newUnreadCount, _renderComponent2, getByTestId, message;

          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  newUnreadCount = (0, _mockBuilders.getRandomInt)(1, 10);

                  c0.countUnread = function () {
                    return newUnreadCount;
                  };

                  (_renderComponent2 = renderComponent(
                    {
                      channel: c0,
                      activeChannel: c1,
                    },
                    _react2.render,
                  )),
                    (getByTestId = _renderComponent2.getByTestId);
                  _context5.next = 5;
                  return (0, _react2.waitFor)(function () {
                    expect(getByTestId('channel-id')).toBeInTheDocument();
                  });

                case 5:
                  message = (0, _mockBuilders.generateMessage)();
                  (0, _react2.act)(function () {
                    dispatcher(chatClientUthred, message, c0);
                  });
                  _context5.next = 9;
                  return expectLastEventMessageToBe(getByTestId, message.text);

                case 9:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5);
        }),
      ),
    ); // eslint-disable-next-line jest/expect-expect

    it(
      'should update unreadCount, in case of inactive channel',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
          var newUnreadCount, _renderComponent3, getByTestId, message;

          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  newUnreadCount = (0, _mockBuilders.getRandomInt)(1, 10);

                  c0.countUnread = function () {
                    return newUnreadCount;
                  };

                  (_renderComponent3 = renderComponent(
                    {
                      channel: c0,
                      activeChannel: c1,
                    },
                    _react2.render,
                  )),
                    (getByTestId = _renderComponent3.getByTestId);
                  _context6.next = 5;
                  return expectUnreadCountToBe(getByTestId, newUnreadCount);

                case 5:
                  newUnreadCount = (0, _mockBuilders.getRandomInt)(1, 10);
                  message = (0, _mockBuilders.generateMessage)();
                  (0, _react2.act)(function () {
                    dispatcher(chatClientUthred, message, c0);
                  });
                  _context6.next = 10;
                  return expectUnreadCountToBe(getByTestId, newUnreadCount);

                case 10:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6);
        }),
      ),
    ); // eslint-disable-next-line jest/expect-expect

    it(
      'should set unreadCount to 0, in case of active channel',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
          var _renderComponent4, getByTestId, message;

          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch ((_context7.prev = _context7.next)) {
                case 0:
                  (_renderComponent4 = renderComponent(
                    {
                      channel: c0,
                      activeChannel: c0,
                    },
                    _react2.render,
                  )),
                    (getByTestId = _renderComponent4.getByTestId);
                  _context7.next = 3;
                  return expectUnreadCountToBe(getByTestId, 0);

                case 3:
                  message = (0, _mockBuilders.generateMessage)();
                  (0, _react2.act)(function () {
                    dispatcher(chatClientUthred, message, c0);
                  });
                  _context7.next = 7;
                  return expectUnreadCountToBe(getByTestId, 0);

                case 7:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7);
        }),
      ),
    ); // eslint-disable-next-line jest/expect-expect

    it(
      'should set unreadCount to 0, in case of muted channel',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
          var channelMuteSpy, _renderComponent5, getByTestId, message;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch ((_context8.prev = _context8.next)) {
                case 0:
                  channelMuteSpy = jest
                    .spyOn(c0, 'muteStatus')
                    .mockImplementation(function () {
                      return {
                        muted: true,
                      };
                    });
                  (_renderComponent5 = renderComponent(
                    {
                      channel: c0,
                      activeChannel: c1,
                    },
                    _react2.render,
                  )),
                    (getByTestId = _renderComponent5.getByTestId);
                  _context8.next = 4;
                  return (0, _react2.waitFor)(function () {
                    expect(channelMuteSpy).toHaveBeenCalledWith();
                  });

                case 4:
                  _context8.next = 6;
                  return expectUnreadCountToBe(getByTestId, 0);

                case 6:
                  message = (0, _mockBuilders.generateMessage)();
                  (0, _react2.act)(function () {
                    dispatcher(chatClientUthred, message, c0);
                  });
                  _context8.next = 10;
                  return expectUnreadCountToBe(getByTestId, 0);

                case 10:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8);
        }),
      ),
    );
  });
});
