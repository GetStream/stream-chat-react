'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
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

var _dom = require('@testing-library/dom');

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _uuid = require('uuid');

var _context34 = require('../../../context');

var _Chat = require('../../Chat');

var _ChannelList = _interopRequireDefault(require('../ChannelList'));

var _ChannelPreview = require('../../ChannelPreview');

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

/**
 * We are gonna use following custom UI components for preview and list.
 * If we use ChannelPreviewMessenger or ChannelPreviewLastMessage here, then changes
 * to those components might end up breaking tests for ChannelList, which will be quite painful
 * to debug then.
 */
var ChannelPreviewComponent = function ChannelPreviewComponent(_ref) {
  var channel = _ref.channel,
    latestMessage = _ref.latestMessage,
    channelUpdateCount = _ref.channelUpdateCount;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      role: 'listitem',
      'data-testid': channel.id,
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'channelUpdateCount',
      },
      channelUpdateCount,
    ),
    /*#__PURE__*/ _react.default.createElement('div', null, channel.data.name),
    /*#__PURE__*/ _react.default.createElement('div', null, latestMessage),
  );
};

var ChannelListComponent = function ChannelListComponent(props) {
  var error = props.error,
    loading = props.loading;

  if (error) {
    return /*#__PURE__*/ _react.default.createElement('div', {
      'data-testid': 'error-indicator',
    });
  }

  if (loading) {
    return /*#__PURE__*/ _react.default.createElement('div', {
      'data-testid': 'loading-indicator',
    });
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      role: 'list',
    },
    props.children,
  );
};

var ROLE_LIST_ITEM_SELECTOR = '[role="listitem"]';
describe('ChannelList', function () {
  var chatClientUthred;
  var testChannel1;
  var testChannel2;
  var testChannel3;
  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)({
                  id: 'uthred',
                });

              case 2:
                chatClientUthred = _context.sent;
                testChannel1 = (0, _mockBuilders.generateChannel)();
                testChannel2 = (0, _mockBuilders.generateChannel)();
                testChannel3 = (0, _mockBuilders.generateChannel)();

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  afterEach(_react2.cleanup);
  describe('mobile navigation', function () {
    var closeMobileNav;
    var props;
    beforeEach(function () {
      closeMobileNav = jest.fn();
      props = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
        closeMobileNav,
      };
      (0,
      _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([])]);
    });
    it(
      'should call `closeMobileNav` prop function, when clicked outside ChannelList',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
          var _render, getByTestId, getByRole;

          return _regenerator.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch ((_context2.prev = _context2.next)) {
                case 0:
                  (_render = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _context34.ChatContext.Provider,
                      {
                        value: {
                          client: chatClientUthred,
                          closeMobileNav,
                          navOpen: true,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _ChannelList.default,
                        props,
                      ),
                      /*#__PURE__*/ _react.default.createElement('div', {
                        'data-testid': 'outside-channellist',
                      }),
                    ),
                  )),
                    (getByTestId = _render.getByTestId),
                    (getByRole = _render.getByRole); // Wait for list of channels to load in DOM.

                  _context2.next = 3;
                  return (0, _react2.waitFor)(function () {
                    expect(getByRole('list')).toBeInTheDocument();
                  });

                case 3:
                  _react2.fireEvent.click(getByTestId('outside-channellist'));

                  _context2.next = 6;
                  return (0, _react2.waitFor)(function () {
                    expect(closeMobileNav).toHaveBeenCalledTimes(1);
                  });

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
      'should not call `closeMobileNav` prop function on click, if ChannelList is collapsed',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
          var _render2, getByTestId, getByRole;

          return _regenerator.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch ((_context3.prev = _context3.next)) {
                case 0:
                  (_render2 = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _context34.ChatContext.Provider,
                      {
                        value: {
                          client: chatClientUthred,
                          closeMobileNav,
                          navOpen: false,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _ChannelList.default,
                        props,
                      ),
                      /*#__PURE__*/ _react.default.createElement('div', {
                        'data-testid': 'outside-channellist',
                      }),
                    ),
                  )),
                    (getByTestId = _render2.getByTestId),
                    (getByRole = _render2.getByRole); // Wait for list of channels to load in DOM.

                  _context3.next = 3;
                  return (0, _react2.waitFor)(function () {
                    expect(getByRole('list')).toBeInTheDocument();
                  });

                case 3:
                  _react2.fireEvent.click(getByTestId('outside-channellist'));

                  _context3.next = 6;
                  return (0, _react2.waitFor)(function () {
                    expect(closeMobileNav).toHaveBeenCalledTimes(0);
                  });

                case 6:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3);
        }),
      ),
    );
  });
  it(
    'should re-query channels when filters change',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var props, _render3, getByTestId, getByRole, rerender;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                props = {
                  filters: {},
                  Preview: ChannelPreviewComponent,
                  List: ChannelListComponent,
                };
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([testChannel1]),
                ]);
                (_render3 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      props,
                    ),
                  ),
                )),
                  (getByTestId = _render3.getByTestId),
                  (getByRole = _render3.getByRole),
                  (rerender = _render3.rerender); // Wait for list of channels to load in DOM.

                _context4.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByRole('list')).toBeInTheDocument();
                });

              case 5:
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([testChannel2]),
                ]);
                rerender(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      (0, _extends2.default)({}, props, {
                        filters: {
                          dummyFilter: true,
                        },
                      }),
                    ),
                  ),
                );
                _context4.next = 9;
                return (0, _react2.waitFor)(function () {
                  expect(
                    getByTestId(testChannel2.channel.id),
                  ).toBeInTheDocument();
                });

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
    'should only show filtered channels when a filter function prop is provided',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var filteredChannel,
          customFilterFunction,
          props,
          _render4,
          getByRole,
          queryAllByRole;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                filteredChannel = (0, _mockBuilders.generateChannel)({
                  channel: {
                    type: 'filtered',
                  },
                });

                customFilterFunction = function customFilterFunction(channels) {
                  return channels.filter(function (channel) {
                    return channel.type === 'filtered';
                  });
                };

                props = {
                  filters: {},
                  Preview: ChannelPreviewComponent,
                  List: ChannelListComponent,
                  channelRenderFilterFn: customFilterFunction,
                };
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([
                    filteredChannel,
                    testChannel1,
                  ]),
                ]);
                (_render4 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      props,
                    ),
                  ),
                )),
                  (getByRole = _render4.getByRole),
                  (queryAllByRole = _render4.queryAllByRole); // Wait for list of channels to load in DOM.

                _context5.next = 7;
                return (0, _react2.waitFor)(function () {
                  expect(getByRole('list')).toBeInTheDocument();
                  expect(queryAllByRole('listitem')).toHaveLength(1);
                });

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
    'should render `LoadingErrorIndicator` when queryChannels api throws error',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var _render5, getByTestId;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.erroredGetApi)(),
                ]);
                jest.spyOn(console, 'warn').mockImplementationOnce(function () {
                  return null;
                });
                (_render5 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      {
                        filters: {},
                        Preview: ChannelPreviewComponent,
                        List: ChannelListComponent,
                        options: {
                          state: true,
                          watch: true,
                          presence: true,
                        },
                      },
                    ),
                  ),
                )),
                  (getByTestId = _render5.getByTestId); // Wait for list of channels to load in DOM.

                _context6.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('error-indicator')).toBeInTheDocument();
                });

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
    'ChannelPreview UI components should render `Avatar` when the custom prop is provided',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var _render6, getByTestId, rerender;

        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([testChannel1]),
                ]);
                (_render6 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      {
                        Avatar: function Avatar() {
                          return /*#__PURE__*/ _react.default.createElement(
                            'div',
                            {
                              'data-testid': 'custom-avatar-compact',
                            },
                            'Avatar',
                          );
                        },
                        Preview: _ChannelPreview.ChannelPreviewCompact,
                        List: ChannelListComponent,
                      },
                    ),
                  ),
                )),
                  (getByTestId = _render6.getByTestId),
                  (rerender = _render6.rerender);
                _context7.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(
                    getByTestId('custom-avatar-compact'),
                  ).toBeInTheDocument();
                });

              case 4:
                rerender(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      {
                        Avatar: function Avatar() {
                          return /*#__PURE__*/ _react.default.createElement(
                            'div',
                            {
                              'data-testid': 'custom-avatar-last',
                            },
                            'Avatar',
                          );
                        },
                        Preview: _ChannelPreview.ChannelPreviewLastMessage,
                        List: ChannelListComponent,
                      },
                    ),
                  ),
                );
                _context7.next = 7;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('custom-avatar-last')).toBeInTheDocument();
                });

              case 7:
                rerender(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      {
                        Avatar: function Avatar() {
                          return /*#__PURE__*/ _react.default.createElement(
                            'div',
                            {
                              'data-testid': 'custom-avatar-messenger',
                            },
                            'Avatar',
                          );
                        },
                        Preview: _ChannelPreview.ChannelPreviewMessenger,
                        List: ChannelListComponent,
                      },
                    ),
                  ),
                );
                _context7.next = 10;
                return (0, _react2.waitFor)(function () {
                  expect(
                    getByTestId('custom-avatar-messenger'),
                  ).toBeInTheDocument();
                });

              case 10:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'when queryChannels api returns no channels, `EmptyStateIndicator` should be rendered',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var EmptyStateIndicator, _render7, getByTestId;

        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                  (0, _mockBuilders.queryChannelsApi)([]),
                ]);

                EmptyStateIndicator = function EmptyStateIndicator() {
                  return /*#__PURE__*/ _react.default.createElement('div', {
                    'data-testid': 'empty-state-indicator',
                  });
                };

                (_render7 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClientUthred,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _ChannelList.default,
                      {
                        filters: {},
                        EmptyStateIndicator: EmptyStateIndicator,
                        List: ChannelListComponent,
                        options: {
                          state: true,
                          watch: true,
                          presence: true,
                        },
                      },
                    ),
                  ),
                )),
                  (getByTestId = _render7.getByTestId); // Wait for list of channels to load in DOM.

                _context8.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(
                    getByTestId('empty-state-indicator'),
                  ).toBeInTheDocument();
                });

              case 5:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  describe('Default and custom active channel', function () {
    var setActiveChannel;
    var watchersConfig = {
      limit: 20,
      offset: 0,
    };

    var testSetActiveChannelCall = function testSetActiveChannelCall(
      channelInstance,
    ) {
      return (0, _react2.waitFor)(function () {
        expect(setActiveChannel).toHaveBeenCalledTimes(1);
        expect(setActiveChannel).toHaveBeenCalledWith(
          channelInstance,
          watchersConfig,
        );
        return true;
      });
    };

    beforeEach(function () {
      setActiveChannel = jest.fn();
      (0,
      _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2])]);
    });
    it(
      'should call `setActiveChannel` prop function with first channel as param',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
          var channelInstance;
          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch ((_context9.prev = _context9.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _context34.ChatContext.Provider,
                      {
                        value: {
                          client: chatClientUthred,
                          setActiveChannel,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _ChannelList.default,
                        {
                          filters: {},
                          List: ChannelListComponent,
                          setActiveChannelOnMount: true,
                          watchers: watchersConfig,
                          options: {
                            state: true,
                            watch: true,
                            presence: true,
                          },
                        },
                      ),
                    ),
                  );
                  channelInstance = chatClientUthred.channel(
                    testChannel1.channel.type,
                    testChannel1.channel.id,
                  );
                  _context9.t0 = expect;
                  _context9.next = 5;
                  return testSetActiveChannelCall(channelInstance);

                case 5:
                  _context9.t1 = _context9.sent;
                  (0, _context9.t0)(_context9.t1).toBe(true);

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
      'should call `setActiveChannel` prop function with channel (which has `customActiveChannel` id)  as param',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
          var channelInstance;
          return _regenerator.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch ((_context10.prev = _context10.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _context34.ChatContext.Provider,
                      {
                        value: {
                          client: chatClientUthred,
                          setActiveChannel,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _ChannelList.default,
                        {
                          filters: {},
                          List: ChannelListComponent,
                          setActiveChannelOnMount: true,
                          setActiveChannel: setActiveChannel,
                          customActiveChannel: testChannel2.channel.id,
                          watchers: watchersConfig,
                          options: {
                            state: true,
                            watch: true,
                            presence: true,
                          },
                        },
                      ),
                    ),
                  );
                  channelInstance = chatClientUthred.channel(
                    testChannel2.channel.type,
                    testChannel2.channel.id,
                  );
                  _context10.t0 = expect;
                  _context10.next = 5;
                  return testSetActiveChannelCall(channelInstance);

                case 5:
                  _context10.t1 = _context10.sent;
                  (0, _context10.t0)(_context10.t1).toBe(true);

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
      'should render channel with id `customActiveChannel` at top of the list',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
          var _render8,
            getByTestId,
            getByRole,
            getAllByRole,
            items,
            channelPreview;

          return _regenerator.default.wrap(function _callee11$(_context11) {
            while (1) {
              switch ((_context11.prev = _context11.next)) {
                case 0:
                  (_render8 = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _context34.ChatContext.Provider,
                      {
                        value: {
                          client: chatClientUthred,
                          setActiveChannel,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _ChannelList.default,
                        {
                          filters: {},
                          Preview: ChannelPreviewComponent,
                          List: ChannelListComponent,
                          setActiveChannelOnMount: true,
                          setActiveChannel: setActiveChannel,
                          customActiveChannel: testChannel2.channel.id,
                          watchers: watchersConfig,
                          options: {
                            state: true,
                            watch: true,
                            presence: true,
                          },
                        },
                      ),
                    ),
                  )),
                    (getByTestId = _render8.getByTestId),
                    (getByRole = _render8.getByRole),
                    (getAllByRole = _render8.getAllByRole); // Wait for list of channels to load in DOM.

                  _context11.next = 3;
                  return (0, _react2.waitFor)(function () {
                    expect(getByRole('list')).toBeInTheDocument();
                  });

                case 3:
                  items = getAllByRole('listitem'); // Get the closest listitem to the channel that received new message.

                  channelPreview = getByTestId(testChannel2.channel.id).closest(
                    ROLE_LIST_ITEM_SELECTOR,
                  );
                  expect(channelPreview.isEqualNode(items[0])).toBe(true);

                case 6:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11);
        }),
      ),
    );
  });
  describe('Event handling', function () {
    describe('message.new', function () {
      var props = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };

      var sendNewMessageOnChannel3 = function sendNewMessageOnChannel3() {
        var newMessage = (0, _mockBuilders.generateMessage)({
          user: (0, _mockBuilders.generateUser)(),
        });
        (0, _react2.act)(function () {
          return (0,
          _mockBuilders.dispatchMessageNewEvent)(chatClientUthred, newMessage, testChannel3.channel);
        });
        return newMessage;
      };

      beforeEach(function () {
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2, testChannel3])]);
      });
      it(
        'should move channel to top of the list',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
            var _render9,
              getByText,
              getByRole,
              getAllByRole,
              newMessage,
              items,
              channelPreview;

            return _regenerator.default.wrap(function _callee12$(_context12) {
              while (1) {
                switch ((_context12.prev = _context12.next)) {
                  case 0:
                    (_render9 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          props,
                        ),
                      ),
                    )),
                      (getByText = _render9.getByText),
                      (getByRole = _render9.getByRole),
                      (getAllByRole = _render9.getAllByRole); // Wait for list of channels to load in DOM.

                    _context12.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    newMessage = sendNewMessageOnChannel3();
                    _context12.next = 6;
                    return (0, _react2.waitFor)(function () {
                      expect(getByText(newMessage.text)).toBeInTheDocument();
                    });

                  case 6:
                    items = getAllByRole('listitem'); // Get the closes listitem to the channel that received new message.

                    channelPreview = getByText(newMessage.text).closest(
                      ROLE_LIST_ITEM_SELECTOR,
                    );
                    expect(channelPreview.isEqualNode(items[0])).toBe(true);

                  case 9:
                  case 'end':
                    return _context12.stop();
                }
              }
            }, _callee12);
          }),
        ),
      );
      it(
        'should not alter order if `lockChannelOrder` prop is true',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
            var _render10,
              getByText,
              getByRole,
              getAllByRole,
              newMessage,
              items,
              channelPreview;

            return _regenerator.default.wrap(function _callee13$(_context13) {
              while (1) {
                switch ((_context13.prev = _context13.next)) {
                  case 0:
                    (_render10 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, props, {
                            lockChannelOrder: true,
                          }),
                        ),
                      ),
                    )),
                      (getByText = _render10.getByText),
                      (getByRole = _render10.getByRole),
                      (getAllByRole = _render10.getAllByRole); // Wait for list of channels to load in DOM.

                    _context13.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    newMessage = sendNewMessageOnChannel3();
                    _context13.next = 6;
                    return (0, _react2.waitFor)(function () {
                      expect(getByText(newMessage.text)).toBeInTheDocument();
                    });

                  case 6:
                    items = getAllByRole('listitem'); // Get the closes listitem to the channel that received new message.

                    channelPreview = getByText(newMessage.text).closest(
                      ROLE_LIST_ITEM_SELECTOR,
                    );
                    expect(channelPreview.isEqualNode(items[2])).toBe(true);

                  case 9:
                  case 'end':
                    return _context13.stop();
                }
              }
            }, _callee13);
          }),
        ),
      );
    });
    describe('notification.message_new', function () {
      it(
        'should move channel to top of the list by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
            var _render11,
              getByRole,
              getByTestId,
              getAllByRole,
              items,
              channelPreview;

            return _regenerator.default.wrap(function _callee14$(_context14) {
              while (1) {
                switch ((_context14.prev = _context14.next)) {
                  case 0:
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([
                        testChannel1,
                        testChannel2,
                      ]),
                    ]);
                    (_render11 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          {
                            filters: {},
                            Preview: ChannelPreviewComponent,
                            List: ChannelListComponent,
                            options: {
                              state: true,
                              watch: true,
                              presence: true,
                            },
                          },
                        ),
                      ),
                    )),
                      (getByRole = _render11.getByRole),
                      (getByTestId = _render11.getByTestId),
                      (getAllByRole = _render11.getAllByRole); // Wait for list of channels to load in DOM.

                    _context14.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.getOrCreateChannelApi)(testChannel3),
                    ]);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationMessageNewEvent)(chatClientUthred, testChannel3.channel);
                    });
                    _context14.next = 8;
                    return (0, _react2.waitFor)(function () {
                      expect(
                        getByTestId(testChannel3.channel.id),
                      ).toBeInTheDocument();
                    });

                  case 8:
                    items = getAllByRole('listitem'); // Get the closes listitem to the channel that received new message.

                    channelPreview = getByTestId(testChannel3.channel.id);
                    expect(channelPreview.isEqualNode(items[0])).toBe(true);

                  case 11:
                  case 'end':
                    return _context14.stop();
                }
              }
            }, _callee14);
          }),
        ),
      );
      it(
        'should call `onMessageNew` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
            var onMessageNew, _render12, getByRole;

            return _regenerator.default.wrap(function _callee15$(_context15) {
              while (1) {
                switch ((_context15.prev = _context15.next)) {
                  case 0:
                    onMessageNew = jest.fn();
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([testChannel1]),
                    ]);
                    (_render12 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          {
                            filters: {},
                            Preview: ChannelPreviewComponent,
                            List: ChannelListComponent,
                            onMessageNew: onMessageNew,
                            options: {
                              state: true,
                              watch: true,
                              presence: true,
                            },
                          },
                        ),
                      ),
                    )),
                      (getByRole = _render12.getByRole); // Wait for list of channels to load in DOM.

                    _context15.next = 5;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 5:
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.getOrCreateChannelApi)(testChannel2),
                    ]);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationMessageNewEvent)(chatClientUthred, testChannel2.channel);
                    });
                    _context15.next = 9;
                    return (0, _react2.waitFor)(function () {
                      expect(onMessageNew).toHaveBeenCalledTimes(1);
                    });

                  case 9:
                  case 'end':
                    return _context15.stop();
                }
              }
            }, _callee15);
          }),
        ),
      );
    });
    describe('notification.added_to_channel', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
        options: {
          state: true,
          watch: true,
          presence: true,
        },
      };
      beforeEach(
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
            return _regenerator.default.wrap(function _callee16$(_context16) {
              while (1) {
                switch ((_context16.prev = _context16.next)) {
                  case 0:
                    _context16.next = 2;
                    return (0, _mockBuilders.getTestClientWithUser)({
                      id: 'vishal',
                    });

                  case 2:
                    chatClientUthred = _context16.sent;
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([
                        testChannel1,
                        testChannel2,
                      ]),
                    ]);

                  case 4:
                  case 'end':
                    return _context16.stop();
                }
              }
            }, _callee16);
          }),
        ),
      );
      it(
        'should move channel to top of the list by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
            var _render13,
              getByRole,
              getByTestId,
              getAllByRole,
              items,
              channelPreview;

            return _regenerator.default.wrap(function _callee17$(_context17) {
              while (1) {
                switch ((_context17.prev = _context17.next)) {
                  case 0:
                    (_render13 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render13.getByRole),
                      (getByTestId = _render13.getByTestId),
                      (getAllByRole = _render13.getAllByRole); // Wait for list of channels to load in DOM.

                    _context17.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.getOrCreateChannelApi)(testChannel3),
                    ]);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationAddedToChannelEvent)(chatClientUthred, testChannel3.channel);
                    });
                    _context17.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(
                        getByTestId(testChannel3.channel.id),
                      ).toBeInTheDocument();
                    });

                  case 7:
                    items = getAllByRole('listitem'); // Get the closes listitem to the channel that received new message.

                    channelPreview = getByTestId(testChannel3.channel.id);
                    expect(channelPreview.isEqualNode(items[0])).toBe(true);

                  case 10:
                  case 'end':
                    return _context17.stop();
                }
              }
            }, _callee17);
          }),
        ),
      );
      it(
        'should call `onAddedToChannel` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
            var onAddedToChannel, _render14, getByRole;

            return _regenerator.default.wrap(function _callee18$(_context18) {
              while (1) {
                switch ((_context18.prev = _context18.next)) {
                  case 0:
                    onAddedToChannel = jest.fn();
                    (_render14 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onAddedToChannel: onAddedToChannel,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render14.getByRole); // Wait for list of channels to load in DOM.

                    _context18.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationAddedToChannelEvent)(chatClientUthred, testChannel3.channel);
                    });
                    _context18.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(onAddedToChannel).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context18.stop();
                }
              }
            }, _callee18);
          }),
        ),
      );
    });
    describe('notification.removed_from_channel', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };
      beforeEach(function () {
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2, testChannel3])]);
      });
      it(
        'should remove the channel from list by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
            var _render15, getByRole, getByTestId, nodeToBeRemoved;

            return _regenerator.default.wrap(function _callee19$(_context19) {
              while (1) {
                switch ((_context19.prev = _context19.next)) {
                  case 0:
                    (_render15 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render15.getByRole),
                      (getByTestId = _render15.getByTestId); // Wait for list of channels to load in DOM.

                    _context19.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    nodeToBeRemoved = getByTestId(testChannel3.channel.id);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationRemovedFromChannel)(chatClientUthred, testChannel3.channel);
                    });
                    _context19.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(nodeToBeRemoved).not.toBeInTheDocument();
                    });

                  case 7:
                  case 'end':
                    return _context19.stop();
                }
              }
            }, _callee19);
          }),
        ),
      );
      it(
        'should call `onRemovedFromChannel` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
            var onRemovedFromChannel, _render16, getByRole;

            return _regenerator.default.wrap(function _callee20$(_context20) {
              while (1) {
                switch ((_context20.prev = _context20.next)) {
                  case 0:
                    onRemovedFromChannel = jest.fn();
                    (_render16 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onRemovedFromChannel: onRemovedFromChannel,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render16.getByRole); // Wait for list of channels to load in DOM.

                    _context20.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchNotificationRemovedFromChannel)(chatClientUthred, testChannel3.channel);
                    });
                    _context20.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(onRemovedFromChannel).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context20.stop();
                }
              }
            }, _callee20);
          }),
        ),
      );
    });
    describe('channel.updated', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };
      beforeEach(function () {
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2])]);
      });
      it(
        'should update the channel in list, by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
            var _render17, getByRole, getByText, newChannelName;

            return _regenerator.default.wrap(function _callee21$(_context21) {
              while (1) {
                switch ((_context21.prev = _context21.next)) {
                  case 0:
                    (_render17 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render17.getByRole),
                      (getByText = _render17.getByText); // Wait for list of channels to load in DOM.

                    _context21.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    newChannelName = (0, _uuid.v4)();
                    (0, _react2.act)(function () {
                      return (0, _mockBuilders.dispatchChannelUpdatedEvent)(
                        chatClientUthred,
                        _objectSpread(
                          _objectSpread({}, testChannel2.channel),
                          {},
                          {
                            name: newChannelName,
                          },
                        ),
                      );
                    });
                    _context21.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(getByText(newChannelName)).toBeInTheDocument();
                    });

                  case 7:
                  case 'end':
                    return _context21.stop();
                }
              }
            }, _callee21);
          }),
        ),
      );
      it(
        'should call `onChannelUpdated` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee22() {
            var onChannelUpdated, _render18, getByRole, newChannelName;

            return _regenerator.default.wrap(function _callee22$(_context22) {
              while (1) {
                switch ((_context22.prev = _context22.next)) {
                  case 0:
                    onChannelUpdated = jest.fn();
                    (_render18 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onChannelUpdated: onChannelUpdated,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render18.getByRole); // Wait for list of channels to load in DOM.

                    _context22.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    newChannelName = (0, _uuid.v4)();
                    (0, _react2.act)(function () {
                      return (0, _mockBuilders.dispatchChannelUpdatedEvent)(
                        chatClientUthred,
                        _objectSpread(
                          _objectSpread({}, testChannel2.channel),
                          {},
                          {
                            name: newChannelName,
                          },
                        ),
                      );
                    });
                    _context22.next = 8;
                    return (0, _react2.waitFor)(function () {
                      expect(onChannelUpdated).toHaveBeenCalledTimes(1);
                    });

                  case 8:
                  case 'end':
                    return _context22.stop();
                }
              }
            }, _callee22);
          }),
        ),
      );
    });
    describe('channel.deleted', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };
      beforeEach(function () {
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2])]);
      });
      it(
        'should remove channel from list, by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee23() {
            var _render19, getByRole, getByTestId, nodeToBeRemoved;

            return _regenerator.default.wrap(function _callee23$(_context23) {
              while (1) {
                switch ((_context23.prev = _context23.next)) {
                  case 0:
                    (_render19 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render19.getByRole),
                      (getByTestId = _render19.getByTestId); // Wait for list of channels to load in DOM.

                    _context23.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    nodeToBeRemoved = getByTestId(testChannel2.channel.id);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelDeletedEvent)(chatClientUthred, testChannel2.channel);
                    });
                    _context23.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(nodeToBeRemoved).not.toBeInTheDocument();
                    });

                  case 7:
                  case 'end':
                    return _context23.stop();
                }
              }
            }, _callee23);
          }),
        ),
      );
      it(
        'should call `onChannelDeleted` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee24() {
            var onChannelDeleted, _render20, getByRole;

            return _regenerator.default.wrap(function _callee24$(_context24) {
              while (1) {
                switch ((_context24.prev = _context24.next)) {
                  case 0:
                    onChannelDeleted = jest.fn();
                    (_render20 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onChannelDeleted: onChannelDeleted,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render20.getByRole); // Wait for list of channels to load in DOM.

                    _context24.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelDeletedEvent)(chatClientUthred, testChannel2.channel);
                    });
                    _context24.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(onChannelDeleted).toHaveBeenCalledTimes(1);
                    });

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
        'should unset activeChannel if it was deleted',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
            var setActiveChannel, _render21, getByRole;

            return _regenerator.default.wrap(function _callee25$(_context25) {
              while (1) {
                switch ((_context25.prev = _context25.next)) {
                  case 0:
                    setActiveChannel = jest.fn();
                    (_render21 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _context34.ChatContext.Provider,
                        {
                          value: {
                            client: chatClientUthred,
                            setActiveChannel,
                          },
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            channel: {
                              cid: testChannel1.channel.cid,
                            },
                            setActiveChannel: setActiveChannel,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render21.getByRole); // Wait for list of channels to load in DOM.

                    _context25.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelDeletedEvent)(chatClientUthred, testChannel1.channel);
                    });
                    _context25.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(setActiveChannel).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context25.stop();
                }
              }
            }, _callee25);
          }),
        ),
      );
    });
    describe('channel.hidden', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };
      beforeEach(function () {
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([testChannel1, testChannel2])]);
      });
      it(
        'should remove channel from list, by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
            var _render22, getByRole, getByTestId, nodeToBeRemoved;

            return _regenerator.default.wrap(function _callee26$(_context26) {
              while (1) {
                switch ((_context26.prev = _context26.next)) {
                  case 0:
                    (_render22 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render22.getByRole),
                      (getByTestId = _render22.getByTestId); // Wait for list of channels to load in DOM.

                    _context26.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    nodeToBeRemoved = getByTestId(testChannel2.channel.id);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelHiddenEvent)(chatClientUthred, testChannel2.channel);
                    });
                    _context26.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(nodeToBeRemoved).not.toBeInTheDocument();
                    });

                  case 7:
                  case 'end':
                    return _context26.stop();
                }
              }
            }, _callee26);
          }),
        ),
      );
      it(
        'should unset activeChannel if it was hidden',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
            var setActiveChannel, _render23, getByRole;

            return _regenerator.default.wrap(function _callee27$(_context27) {
              while (1) {
                switch ((_context27.prev = _context27.next)) {
                  case 0:
                    setActiveChannel = jest.fn();
                    (_render23 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _context34.ChatContext.Provider,
                        {
                          value: {
                            client: chatClientUthred,
                            setActiveChannel,
                          },
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            channel: {
                              cid: testChannel1.channel.cid,
                            },
                            setActiveChannel: setActiveChannel,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render23.getByRole); // Wait for list of channels to load in DOM.

                    _context27.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelHiddenEvent)(chatClientUthred, testChannel1.channel);
                    });
                    _context27.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(setActiveChannel).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context27.stop();
                }
              }
            }, _callee27);
          }),
        ),
      );
    });
    describe('channel.visible', function () {
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
        options: {
          state: true,
          watch: true,
          presence: true,
        },
      };
      beforeEach(
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
            return _regenerator.default.wrap(function _callee28$(_context28) {
              while (1) {
                switch ((_context28.prev = _context28.next)) {
                  case 0:
                    _context28.next = 2;
                    return (0, _mockBuilders.getTestClientWithUser)({
                      id: 'jaap',
                    });

                  case 2:
                    chatClientUthred = _context28.sent;
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([
                        testChannel1,
                        testChannel2,
                      ]),
                    ]);

                  case 4:
                  case 'end':
                    return _context28.stop();
                }
              }
            }, _callee28);
          }),
        ),
      );
      it(
        'should move channel to top of the list by default',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
            var _render24,
              getByRole,
              getByTestId,
              getAllByRole,
              items,
              channelPreview;

            return _regenerator.default.wrap(function _callee29$(_context29) {
              while (1) {
                switch ((_context29.prev = _context29.next)) {
                  case 0:
                    (_render24 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render24.getByRole),
                      (getByTestId = _render24.getByTestId),
                      (getAllByRole = _render24.getAllByRole); // Wait for list of channels to load in DOM.

                    _context29.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.getOrCreateChannelApi)(testChannel3),
                    ]);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelVisibleEvent)(chatClientUthred, testChannel3.channel);
                    });
                    _context29.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(
                        getByTestId(testChannel3.channel.id),
                      ).toBeInTheDocument();
                    });

                  case 7:
                    items = getAllByRole('listitem'); // Get the closes listitem to the channel that received new message.

                    channelPreview = getByTestId(testChannel3.channel.id);
                    expect(channelPreview.isEqualNode(items[0])).toBe(true);

                  case 10:
                  case 'end':
                    return _context29.stop();
                }
              }
            }, _callee29);
          }),
        ),
      );
      it(
        'should call `onChannelVisible` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee30() {
            var onChannelVisible, _render25, getByRole;

            return _regenerator.default.wrap(function _callee30$(_context30) {
              while (1) {
                switch ((_context30.prev = _context30.next)) {
                  case 0:
                    onChannelVisible = jest.fn();
                    (_render25 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onChannelVisible: onChannelVisible,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render25.getByRole); // Wait for list of channels to load in DOM.

                    _context30.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelVisibleEvent)(chatClientUthred, testChannel3.channel);
                    });
                    _context30.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(onChannelVisible).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context30.stop();
                }
              }
            }, _callee30);
          }),
        ),
      );
    });
    describe('connection.recovered', function () {
      it(
        'should rerender the list',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee31() {
            var channel1,
              channel2,
              channelListProps,
              _render26,
              getByRole,
              getByTestId,
              updateCount;

            return _regenerator.default.wrap(function _callee31$(_context31) {
              while (1) {
                switch ((_context31.prev = _context31.next)) {
                  case 0:
                    channel1 = (0, _mockBuilders.generateChannel)();
                    channel2 = (0, _mockBuilders.generateChannel)();
                    channelListProps = {
                      filters: {},
                      Preview: ChannelPreviewComponent,
                      List: ChannelListComponent,
                    };
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([channel1]),
                    ]);
                    (_render26 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render26.getByRole),
                      (getByTestId = _render26.getByTestId); // Wait for list of channels to load in DOM.

                    _context31.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 7:
                    updateCount = parseInt(
                      (0, _dom.getNodeText)(getByTestId('channelUpdateCount')),
                      10,
                    );
                    (0, _mockBuilders.useMockedApis)(chatClientUthred, [
                      (0, _mockBuilders.queryChannelsApi)([channel2]),
                    ]);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchConnectionRecoveredEvent)(chatClientUthred);
                    });
                    _context31.next = 12;
                    return (0, _react2.waitFor)(function () {
                      expect(
                        parseInt(
                          (0, _dom.getNodeText)(
                            getByTestId('channelUpdateCount'),
                          ),
                          10,
                        ),
                      ).toBe(updateCount + 1);
                    });

                  case 12:
                  case 'end':
                    return _context31.stop();
                }
              }
            }, _callee31);
          }),
        ),
      );
    });
    describe('channel.truncated', function () {
      var channel1;
      var user1;
      var message1;
      var message2;
      var channelListProps = {
        filters: {},
        Preview: ChannelPreviewComponent,
        List: ChannelListComponent,
      };
      beforeEach(function () {
        user1 = (0, _mockBuilders.generateUser)();
        message1 = (0, _mockBuilders.generateMessage)({
          user: user1,
        });
        message2 = (0, _mockBuilders.generateMessage)({
          user: user1,
        });
        channel1 = (0, _mockBuilders.generateChannel)({
          messages: [message1, message2],
        });
        (0,
        _mockBuilders.useMockedApis)(chatClientUthred, [(0, _mockBuilders.queryChannelsApi)([channel1])]);
      });
      it(
        'should remove latest message',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee32() {
            var _render27, getByRole, getByText, latestMessageNode;

            return _regenerator.default.wrap(function _callee32$(_context32) {
              while (1) {
                switch ((_context32.prev = _context32.next)) {
                  case 0:
                    (_render27 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          channelListProps,
                        ),
                      ),
                    )),
                      (getByRole = _render27.getByRole),
                      (getByText = _render27.getByText); // Wait for list of channels to load in DOM.

                    _context32.next = 3;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 3:
                    latestMessageNode = getByText(message2.text);
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelTruncatedEvent)(chatClientUthred, channel1.channel);
                    });
                    _context32.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(latestMessageNode).not.toHaveTextContent(
                        message2.text,
                      );
                    });

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
        'should call `onChannelTruncated` function prop, if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee33() {
            var onChannelTruncated, _render28, getByRole;

            return _regenerator.default.wrap(function _callee33$(_context33) {
              while (1) {
                switch ((_context33.prev = _context33.next)) {
                  case 0:
                    onChannelTruncated = jest.fn();
                    (_render28 = (0, _react2.render)(
                      /*#__PURE__*/ _react.default.createElement(
                        _Chat.Chat,
                        {
                          client: chatClientUthred,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          _ChannelList.default,
                          (0, _extends2.default)({}, channelListProps, {
                            onChannelTruncated: onChannelTruncated,
                          }),
                        ),
                      ),
                    )),
                      (getByRole = _render28.getByRole); // Wait for list of channels to load in DOM.

                    _context33.next = 4;
                    return (0, _react2.waitFor)(function () {
                      expect(getByRole('list')).toBeInTheDocument();
                    });

                  case 4:
                    (0, _react2.act)(function () {
                      return (0,
                      _mockBuilders.dispatchChannelTruncatedEvent)(chatClientUthred, channel1.channel);
                    });
                    _context33.next = 7;
                    return (0, _react2.waitFor)(function () {
                      expect(onChannelTruncated).toHaveBeenCalledTimes(1);
                    });

                  case 7:
                  case 'end':
                    return _context33.stop();
                }
              }
            }, _callee33);
          }),
        ),
      );
    });
  });
});
