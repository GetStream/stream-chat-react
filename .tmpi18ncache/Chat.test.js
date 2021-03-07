'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireWildcard(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _ = require('..');

var _context15 = require('../../../context');

var _i18n = require('../../../i18n');

var _package = require('../../../../package.json');

var ChatContextConsumer = function ChatContextConsumer(_ref) {
  var fn = _ref.fn;
  fn((0, _react.useContext)(_context15.ChatContext));
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'children',
  });
};

var TranslationContextConsumer = function TranslationContextConsumer(_ref2) {
  var fn = _ref2.fn;
  fn((0, _react.useContext)(_context15.TranslationContext));
  return /*#__PURE__*/ _react.default.createElement('div', {
    'data-testid': 'children',
  });
};

describe('Chat', function () {
  afterEach(_react2.cleanup);
  var chatClient = (0, _mockBuilders.getTestClient)();
  var originalUserAgent = chatClient.getUserAgent();
  it(
    'should render children without crashing',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _render, getByTestId;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                (_render = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _.Chat,
                    {
                      client: chatClient,
                    },
                    /*#__PURE__*/ _react.default.createElement('div', {
                      'data-testid': 'children',
                    }),
                  ),
                )),
                  (getByTestId = _render.getByTestId);
                _context.next = 3;
                return (0, _react2.waitFor)(function () {
                  return expect(getByTestId('children')).toBeInTheDocument();
                });

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
    'should expose the context',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var context;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _.Chat,
                    {
                      client: chatClient,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      ChatContextConsumer,
                      {
                        fn: function fn(ctx) {
                          context = ctx;
                        },
                      },
                    ),
                  ),
                );
                _context2.next = 3;
                return (0, _react2.waitFor)(function () {
                  expect(context).toBeInstanceOf(Object);
                  expect(context.client).toBe(chatClient);
                  expect(context.channel).toBeUndefined();
                  expect(context.mutes).toStrictEqual([]);
                  expect(context.navOpen).toBe(true);
                  expect(context.theme).toBe('messaging light');
                  expect(context.setActiveChannel).toBeInstanceOf(Function);
                  expect(context.openMobileNav).toBeInstanceOf(Function);
                  expect(context.closeMobileNav).toBeInstanceOf(Function);
                  expect(context.client.getUserAgent()).toBe(
                    'stream-chat-react-'
                      .concat(_package.version, '-')
                      .concat(originalUserAgent),
                  );
                });

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'props change should update the context',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var theme, context, _render2, rerender, newTheme, newClient;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                theme = 'team dark';
                (_render2 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _.Chat,
                    {
                      client: chatClient,
                      theme: theme,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      ChatContextConsumer,
                      {
                        fn: function fn(ctx) {
                          context = ctx;
                        },
                      },
                    ),
                  ),
                )),
                  (rerender = _render2.rerender);
                _context3.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(context.client).toBe(chatClient);
                  expect(context.theme).toBe(theme);
                });

              case 4:
                newTheme = 'messaging dark';
                newClient = (0, _mockBuilders.getTestClient)();
                rerender(
                  /*#__PURE__*/ _react.default.createElement(
                    _.Chat,
                    {
                      client: newClient,
                      theme: newTheme,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      ChatContextConsumer,
                      {
                        fn: function fn(ctx) {
                          context = ctx;
                        },
                      },
                    ),
                  ),
                );
                _context3.next = 9;
                return (0, _react2.waitFor)(function () {
                  expect(context.client).toBe(newClient);
                  expect(context.theme).toBe(newTheme);
                });

              case 9:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  describe('mobile nav', function () {
    it(
      'initialNavOpen prop should set navOpen',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
          var context;
          return _regenerator.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch ((_context4.prev = _context4.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        initialNavOpen: false,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context4.next = 3;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(false);
                  });

                case 3:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4);
        }),
      ),
    );
    it(
      'initialNavOpen prop update should be ignored',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
          var context, _render3, rerender;

          return _regenerator.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch ((_context5.prev = _context5.next)) {
                case 0:
                  (_render3 = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        initialNavOpen: false,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  )),
                    (rerender = _render3.rerender);
                  _context5.next = 3;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(false);
                  });

                case 3:
                  rerender(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        initialNavOpen: true,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context5.next = 6;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(false);
                  });

                case 6:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5);
        }),
      ),
    );
    it(
      'open/close fn updates the nav state',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
          var context;
          return _regenerator.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch ((_context6.prev = _context6.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context6.next = 3;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(true);
                  });

                case 3:
                  (0, _react2.act)(function () {
                    return context.closeMobileNav();
                  });
                  _context6.next = 6;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(false);
                  });

                case 6:
                  (0, _react2.act)(function () {
                    context.openMobileNav();
                  });
                  _context6.next = 9;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(true);
                  });

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
      'setActiveChannel closes the nav',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
          var context;
          return _regenerator.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch ((_context7.prev = _context7.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context7.next = 3;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(true);
                  });

                case 3:
                  _context7.next = 5;
                  return (0, _react2.act)(function () {
                    return context.setActiveChannel();
                  });

                case 5:
                  _context7.next = 7;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.navOpen).toBe(false);
                  });

                case 7:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7);
        }),
      ),
    );
  });
  describe('mutes', function () {
    it(
      'init the mute state with client data',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
          var chatClientWithUser, context, _render4, rerender, mutes;

          return _regenerator.default.wrap(function _callee8$(_context8) {
            while (1) {
              switch ((_context8.prev = _context8.next)) {
                case 0:
                  _context8.next = 2;
                  return (0, _mockBuilders.getTestClientWithUser)({
                    id: 'user_x',
                  });

                case 2:
                  chatClientWithUser = _context8.sent;
                  // First load, mutes are initialized empty
                  chatClientWithUser.user.mutes = [];
                  (_render4 = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClientWithUser,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  )),
                    (rerender = _render4.rerender); // Chat client loads mutes information

                  mutes = ['user_y', 'user_z'];
                  chatClientWithUser.user.mutes = mutes;
                  (0, _react2.act)(function () {
                    rerender(
                      /*#__PURE__*/ _react.default.createElement(
                        _.Chat,
                        {
                          client: chatClientWithUser,
                        },
                        /*#__PURE__*/ _react.default.createElement(
                          ChatContextConsumer,
                          {
                            fn: function fn(ctx) {
                              context = ctx;
                            },
                          },
                        ),
                      ),
                    );
                  });
                  _context8.next = 10;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.mutes).toStrictEqual(mutes);
                  });

                case 10:
                case 'end':
                  return _context8.stop();
              }
            }
          }, _callee8);
        }),
      ),
    );
    it(
      'chat client listens and updates the state on mute event',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
          var chatClientWithUser, context, mutes;
          return _regenerator.default.wrap(function _callee9$(_context9) {
            while (1) {
              switch ((_context9.prev = _context9.next)) {
                case 0:
                  _context9.next = 2;
                  return (0, _mockBuilders.getTestClientWithUser)({
                    id: 'user_x',
                  });

                case 2:
                  chatClientWithUser = _context9.sent;
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClientWithUser,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context9.next = 6;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.mutes).toStrictEqual([]);
                  });

                case 6:
                  mutes = [
                    {
                      user: {
                        id: 'user_y',
                      },
                      target: {
                        id: 'user_y',
                      },
                    },
                  ];
                  (0, _react2.act)(function () {
                    return (0,
                    _mockBuilders.dispatchNotificationMutesUpdated)(chatClientWithUser, mutes);
                  });
                  _context9.next = 10;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.mutes).toStrictEqual(mutes);
                  });

                case 10:
                  (0, _react2.act)(function () {
                    return (0,
                    _mockBuilders.dispatchNotificationMutesUpdated)(chatClientWithUser, null);
                  });
                  _context9.next = 13;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.mutes).toStrictEqual([]);
                  });

                case 13:
                case 'end':
                  return _context9.stop();
              }
            }
          }, _callee9);
        }),
      ),
    );
  });
  describe('active channel', function () {
    it(
      'setActiveChannel query if there is a watcher',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
          var context, channel, watchers;
          return _regenerator.default.wrap(function _callee10$(_context10) {
            while (1) {
              switch ((_context10.prev = _context10.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  channel = {
                    cid: 'cid',
                    query: jest.fn(),
                  };
                  watchers = {
                    user_y: {},
                  };
                  _context10.next = 5;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.channel).toBeUndefined();
                  });

                case 5:
                  _context10.next = 7;
                  return (0, _react2.act)(function () {
                    return context.setActiveChannel(channel, watchers);
                  });

                case 7:
                  _context10.next = 9;
                  return (0, _react2.waitFor)(function () {
                    expect(context.channel).toStrictEqual(channel);
                    expect(channel.query).toHaveBeenCalledTimes(1);
                    expect(channel.query).toHaveBeenCalledWith({
                      watch: true,
                      watchers,
                    });
                  });

                case 9:
                case 'end':
                  return _context10.stop();
              }
            }
          }, _callee10);
        }),
      ),
    );
    it(
      'setActiveChannel prevent event default',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
          var context, e;
          return _regenerator.default.wrap(function _callee11$(_context11) {
            while (1) {
              switch ((_context11.prev = _context11.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        ChatContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context11.next = 3;
                  return (0, _react2.waitFor)(function () {
                    return expect(context.setActiveChannel).not.toBeUndefined();
                  });

                case 3:
                  e = {
                    preventDefault: jest.fn(),
                  };
                  _context11.next = 6;
                  return (0, _react2.act)(function () {
                    return context.setActiveChannel(undefined, {}, e);
                  });

                case 6:
                  _context11.next = 8;
                  return (0, _react2.waitFor)(function () {
                    return expect(e.preventDefault).toHaveBeenCalledTimes(1);
                  });

                case 8:
                case 'end':
                  return _context11.stop();
              }
            }
          }, _callee11);
        }),
      ),
    );
  });
  describe('translation context', function () {
    it(
      'should expose the context',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
          var context;
          return _regenerator.default.wrap(function _callee12$(_context12) {
            while (1) {
              switch ((_context12.prev = _context12.next)) {
                case 0:
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        TranslationContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context12.next = 3;
                  return (0, _react2.waitFor)(function () {
                    expect(context).toBeInstanceOf(Object);
                    expect(context.t).toBeInstanceOf(Function);
                    expect(context.tDateTimeParser).toBeInstanceOf(Function);
                  });

                case 3:
                case 'end':
                  return _context12.stop();
              }
            }
          }, _callee12);
        }),
      ),
    );
    it(
      'should use i18n provided in props',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
          var i18nInstance, context;
          return _regenerator.default.wrap(function _callee13$(_context13) {
            while (1) {
              switch ((_context13.prev = _context13.next)) {
                case 0:
                  i18nInstance = new _i18n.Streami18n();
                  _context13.next = 3;
                  return i18nInstance.getTranslators();

                case 3:
                  i18nInstance.t = 't';
                  i18nInstance.tDateTimeParser = 'tDateTimeParser';
                  (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        i18nInstance: i18nInstance,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        TranslationContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context13.next = 8;
                  return (0, _react2.waitFor)(function () {
                    expect(context.t).toBe(i18nInstance.t);
                    expect(context.tDateTimeParser).toBe(
                      i18nInstance.tDateTimeParser,
                    );
                  });

                case 8:
                case 'end':
                  return _context13.stop();
              }
            }
          }, _callee13);
        }),
      ),
    );
    it(
      'props change should update the context',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
          var i18nInstance, context, _render5, rerender, newI18nInstance;

          return _regenerator.default.wrap(function _callee14$(_context14) {
            while (1) {
              switch ((_context14.prev = _context14.next)) {
                case 0:
                  i18nInstance = new _i18n.Streami18n();
                  _context14.next = 3;
                  return i18nInstance.getTranslators();

                case 3:
                  i18nInstance.t = 't';
                  i18nInstance.tDateTimeParser = 'tDateTimeParser';
                  (_render5 = (0, _react2.render)(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        i18nInstance: i18nInstance,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        TranslationContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  )),
                    (rerender = _render5.rerender);
                  _context14.next = 8;
                  return (0, _react2.waitFor)(function () {
                    expect(context.t).toBe(i18nInstance.t);
                    expect(context.tDateTimeParser).toBe(
                      i18nInstance.tDateTimeParser,
                    );
                  });

                case 8:
                  newI18nInstance = new _i18n.Streami18n();
                  _context14.next = 11;
                  return newI18nInstance.getTranslators();

                case 11:
                  newI18nInstance.t = 'newT';
                  newI18nInstance.tDateTimeParser = 'newtDateTimeParser';
                  rerender(
                    /*#__PURE__*/ _react.default.createElement(
                      _.Chat,
                      {
                        client: chatClient,
                        i18nInstance: newI18nInstance,
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        TranslationContextConsumer,
                        {
                          fn: function fn(ctx) {
                            context = ctx;
                          },
                        },
                      ),
                    ),
                  );
                  _context14.next = 16;
                  return (0, _react2.waitFor)(function () {
                    expect(context.t).toBe(newI18nInstance.t);
                    expect(context.tDateTimeParser).toBe(
                      newI18nInstance.tDateTimeParser,
                    );
                    expect(context.t).not.toBe(i18nInstance.t);
                    expect(context.tDateTimeParser).not.toBe(
                      i18nInstance.tDateTimeParser,
                    );
                  });

                case 16:
                case 'end':
                  return _context14.stop();
              }
            }
          }, _callee14);
        }),
      ),
    );
  });
});
