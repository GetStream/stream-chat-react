'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

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

var _react = _interopRequireWildcard(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _Channel = _interopRequireDefault(require('../Channel'));

var _Chat = require('../../Chat');

var _context35 = require('../../../context');

var _mockBuilders = require('../../../mock-builders');

var _Loading = require('../../Loading');

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

jest.mock('../../Loading', function () {
  return {
    LoadingIndicator: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null, 'loading');
    }),
    LoadingErrorIndicator: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', null);
    }),
  };
});
var chatClient;
var channel; // This component is used for performing effects in a component that consumes ChannelContext,
// i.e. making use of the callbacks & values provided by the Channel component.
// the effect is called every time channelContext changes

var CallbackEffectWithChannelContext = function CallbackEffectWithChannelContext(
  _ref,
) {
  var callback = _ref.callback;
  var channelContext = (0, _react.useContext)(_context35.ChannelContext);
  (0, _react.useEffect)(
    function () {
      callback(channelContext);
    },
    [callback, channelContext],
  );
  return null;
}; // In order for ChannelInner to be rendered, we need to set the active channel first.

var ActiveChannelSetter = function ActiveChannelSetter(_ref2) {
  var activeChannel = _ref2.activeChannel;

  var _useContext = (0, _react.useContext)(_context35.ChatContext),
    setActiveChannel = _useContext.setActiveChannel;

  (0, _react.useEffect)(
    function () {
      setActiveChannel(activeChannel);
    },
    [activeChannel],
  ); // eslint-disable-line

  return null;
};

var user = (0, _mockBuilders.generateUser)({
  name: 'name',
  id: 'id',
});
var messages = [
  (0, _mockBuilders.generateMessage)({
    user,
  }),
];
var pinnedMessages = [
  (0, _mockBuilders.generateMessage)({
    user,
    pinned: true,
  }),
];

var renderComponent = function renderComponent() {
  var props =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var callback =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : function () {};
  return (0, _react2.render)(
    /*#__PURE__*/ _react.default.createElement(
      _Chat.Chat,
      {
        client: chatClient,
      },
      /*#__PURE__*/ _react.default.createElement(ActiveChannelSetter, {
        activeChannel: channel,
      }),
      /*#__PURE__*/ _react.default.createElement(
        _Channel.default,
        props,
        props.children,
        /*#__PURE__*/ _react.default.createElement(
          CallbackEffectWithChannelContext,
          {
            callback: callback,
          },
        ),
      ),
    ),
  );
};

describe('Channel', function () {
  // A simple component that consumes ChannelContext and renders text for non-failed messages
  var MockMessageList = function MockMessageList() {
    var _useContext2 = (0, _react.useContext)(_context35.ChannelContext),
      channelMessages = _useContext2.messages;

    return channelMessages.map(function (_ref3, i) {
      var text = _ref3.text,
        status = _ref3.status;
      return (
        status !== 'failed' &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            key: i,
          },
          text,
        )
      );
    });
  };

  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var members, mockedChannel;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                members = [
                  (0, _mockBuilders.generateMember)({
                    user,
                  }),
                ];
                mockedChannel = (0, _mockBuilders.generateChannel)({
                  messages,
                  members,
                  pinnedMessages,
                });
                _context.next = 4;
                return (0, _mockBuilders.getTestClientWithUser)(user);

              case 4:
                chatClient = _context.sent;
                (0, _mockBuilders.useMockedApis)(chatClient, [
                  (0, _mockBuilders.getOrCreateChannelApi)(mockedChannel),
                ]);
                channel = chatClient.channel('messaging', mockedChannel.id);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  afterEach(function () {
    jest.clearAllMocks();
  });
  it('should render the EmptyPlaceholder prop if the channel is not provided by the ChatContext', function () {
    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_Channel.default, {
          EmptyPlaceholder: /*#__PURE__*/ _react.default.createElement(
            'div',
            null,
            'empty',
          ),
        }),
      ),
      getByText = _render.getByText;

    expect(getByText('empty')).toBeInTheDocument();
  });
  it(
    'should watch the current channel on mount',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var watchSpy;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                watchSpy = jest.spyOn(channel, 'watch');
                renderComponent();
                _context2.next = 4;
                return (0, _react2.waitFor)(function () {
                  return expect(watchSpy).toHaveBeenCalledTimes(1);
                });

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
    'should set an error if watching the channel goes wrong, and render a LoadingErrorIndicator',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var watchError;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                watchError = new Error('watching went wrong');
                jest
                  .spyOn(channel, 'watch')
                  .mockImplementationOnce(function () {
                    return Promise.reject(watchError);
                  });
                renderComponent();
                _context3.next = 5;
                return (0, _react2.waitFor)(function () {
                  return expect(
                    _Loading.LoadingErrorIndicator,
                  ).toHaveBeenCalledWith(
                    expect.objectContaining({
                      error: watchError,
                    }),
                    expect.any(Object),
                  );
                });

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
    'should render a LoadingIndicator if it is loading',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var watchPromise, _renderComponent, getByText;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                watchPromise = new Promise(function () {});
                jest
                  .spyOn(channel, 'watch')
                  .mockImplementationOnce(function () {
                    return watchPromise;
                  });
                (_renderComponent = renderComponent()),
                  (getByText = _renderComponent.getByText);
                _context4.next = 5;
                return (0, _react2.waitFor)(function () {
                  return expect(getByText('loading')).toBeInTheDocument();
                });

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
    'should provide context and render children if channel is set and the component is not loading or errored',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
        var _renderComponent2, findByText;

        return _regenerator.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch ((_context5.prev = _context5.next)) {
              case 0:
                (_renderComponent2 = renderComponent({
                  children: /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                    'children',
                  ),
                })),
                  (findByText = _renderComponent2.findByText);
                _context5.t0 = expect;
                _context5.next = 4;
                return findByText('children');

              case 4:
                _context5.t1 = _context5.sent;
                (0, _context5.t0)(_context5.t1).toBeInTheDocument();

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
    'should store pinned messages as an array in the channel context',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee6() {
        var ctxPins, _renderComponent3, getByText;

        return _regenerator.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch ((_context6.prev = _context6.next)) {
              case 0:
                (_renderComponent3 = renderComponent(
                  {
                    children: /*#__PURE__*/ _react.default.createElement(
                      'div',
                      null,
                      'children',
                    ),
                  },
                  function (ctx) {
                    ctxPins = ctx.pinnedMessages;
                  },
                )),
                  (getByText = _renderComponent3.getByText);
                _context6.next = 3;
                return (0, _react2.waitFor)(function () {
                  expect(getByText('children')).toBeInTheDocument();
                  expect(Array.isArray(ctxPins)).toBe(true);
                });

              case 3:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  ); // should these 'on' tests actually test if the handler works?

  it(
    'should add a connection recovery handler on the client on mount',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
        var clientOnSpy;
        return _regenerator.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch ((_context7.prev = _context7.next)) {
              case 0:
                clientOnSpy = jest.spyOn(chatClient, 'on');
                renderComponent();
                _context7.next = 4;
                return (0, _react2.waitFor)(function () {
                  return expect(clientOnSpy).toHaveBeenCalledWith(
                    'connection.recovered',
                    expect.any(Function),
                  );
                });

              case 4:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7);
      }),
    ),
  );
  it(
    'should add an `on` handler to the channel on mount',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee8() {
        var channelOnSpy;
        return _regenerator.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch ((_context8.prev = _context8.next)) {
              case 0:
                channelOnSpy = jest.spyOn(channel, 'on');
                renderComponent();
                _context8.next = 4;
                return (0, _react2.waitFor)(function () {
                  return expect(channelOnSpy).toHaveBeenCalledWith(
                    expect.any(Function),
                  );
                });

              case 4:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8);
      }),
    ),
  );
  it(
    'should mark the current channel as read if the user switches to the current window',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee9() {
        var markReadSpy, watchSpy;
        return _regenerator.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch ((_context9.prev = _context9.next)) {
              case 0:
                Object.defineProperty(document, 'hidden', {
                  configurable: true,
                  get: function get() {
                    return false;
                  },
                });
                markReadSpy = jest.spyOn(channel, 'markRead');
                watchSpy = jest.spyOn(channel, 'watch');
                renderComponent(); // first, wait for the effect in which the channel is watched,
                // so we know the event listener is added to the document.

                _context9.next = 6;
                return (0, _react2.waitFor)(function () {
                  return expect(watchSpy).toHaveBeenCalledWith();
                });

              case 6:
                (0, _react2.fireEvent)(document, new Event('visibilitychange'));
                _context9.next = 9;
                return (0, _react2.waitFor)(function () {
                  return expect(markReadSpy).toHaveBeenCalledWith();
                });

              case 9:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9);
      }),
    ),
  );
  it(
    'should mark the channel as read if the count of unread messages is higher than 0 on mount',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee10() {
        var markReadSpy;
        return _regenerator.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch ((_context10.prev = _context10.next)) {
              case 0:
                jest
                  .spyOn(channel, 'countUnread')
                  .mockImplementationOnce(function () {
                    return 1;
                  });
                markReadSpy = jest.spyOn(channel, 'markRead');
                renderComponent();
                _context10.next = 5;
                return (0, _react2.waitFor)(function () {
                  return expect(markReadSpy).toHaveBeenCalledWith();
                });

              case 5:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10);
      }),
    ),
  );
  it(
    'should use the doMarkReadRequest prop to mark channel as read, if that is defined',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee11() {
        var doMarkReadRequest;
        return _regenerator.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch ((_context11.prev = _context11.next)) {
              case 0:
                jest
                  .spyOn(channel, 'countUnread')
                  .mockImplementationOnce(function () {
                    return 1;
                  });
                doMarkReadRequest = jest.fn();
                renderComponent({
                  doMarkReadRequest,
                });
                _context11.next = 5;
                return (0, _react2.waitFor)(function () {
                  return expect(doMarkReadRequest).toHaveBeenCalledTimes(1);
                });

              case 5:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11);
      }),
    ),
  );
  describe('Children that consume ChannelContext', function () {
    it(
      'should expose the emoji config',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee12() {
          var context, emojiData, CustomEmojiPicker, CustomEmoji;
          return _regenerator.default.wrap(function _callee12$(_context12) {
            while (1) {
              switch ((_context12.prev = _context12.next)) {
                case 0:
                  emojiData = {
                    compressed: true,
                    categories: [],
                    emojis: {},
                    aliases: {},
                  };

                  CustomEmojiPicker = function CustomEmojiPicker() {
                    return /*#__PURE__*/ _react.default.createElement(
                      'div',
                      null,
                    );
                  };

                  CustomEmoji = function CustomEmoji() {
                    return /*#__PURE__*/ _react.default.createElement(
                      'span',
                      null,
                    );
                  };

                  renderComponent(
                    {
                      emojiData,
                      Emoji: CustomEmoji,
                      EmojiPicker: CustomEmojiPicker,
                    },
                    function (ctx) {
                      context = ctx;
                    },
                  );
                  _context12.next = 6;
                  return (0, _react2.waitFor)(function () {
                    expect(context).toBeInstanceOf(Object);
                    expect(context.emojiConfig.emojiData).toBe(emojiData);
                    expect(context.emojiConfig.EmojiPicker).toBe(
                      CustomEmojiPicker,
                    );
                    expect(context.emojiConfig.Emoji).toBe(CustomEmoji);
                  });

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
      'should be able to open threads',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee13() {
          var threadMessage, hasThread;
          return _regenerator.default.wrap(function _callee13$(_context13) {
            while (1) {
              switch ((_context13.prev = _context13.next)) {
                case 0:
                  threadMessage = messages[0];
                  hasThread = jest.fn(); // this renders Channel, calls openThread from a child context consumer with a message,
                  // and then calls hasThread with the thread id if it was set.

                  renderComponent({}, function (_ref17) {
                    var openThread = _ref17.openThread,
                      thread = _ref17.thread;

                    if (!thread) {
                      openThread(threadMessage);
                    } else {
                      hasThread(thread.id);
                    }
                  });
                  _context13.next = 5;
                  return (0, _react2.waitFor)(function () {
                    return expect(hasThread).toHaveBeenCalledWith(
                      threadMessage.id,
                    );
                  });

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
      'should be able to load more messages in a thread',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee14() {
          var getRepliesSpy, threadMessage, replies, hasThreadMessages;
          return _regenerator.default.wrap(function _callee14$(_context14) {
            while (1) {
              switch ((_context14.prev = _context14.next)) {
                case 0:
                  getRepliesSpy = jest.spyOn(channel, 'getReplies');
                  threadMessage = messages[0];
                  replies = [
                    (0, _mockBuilders.generateMessage)({
                      parent_id: threadMessage.id,
                    }),
                  ];
                  (0, _mockBuilders.useMockedApis)(chatClient, [
                    (0, _mockBuilders.threadRepliesApi)(replies),
                  ]);
                  hasThreadMessages = jest.fn();
                  renderComponent({}, function (_ref19) {
                    var openThread = _ref19.openThread,
                      thread = _ref19.thread,
                      loadMoreThread = _ref19.loadMoreThread,
                      threadMessages = _ref19.threadMessages;

                    if (!thread) {
                      // first, open a thread
                      openThread(threadMessage);
                    } else if (!threadMessages.length) {
                      // then, load more messages in the thread
                      loadMoreThread();
                    } else {
                      // then, call our mock fn so we can verify what was passed as threadMessages
                      hasThreadMessages(threadMessages);
                    }
                  });
                  _context14.next = 8;
                  return (0, _react2.waitFor)(function () {
                    expect(getRepliesSpy).toHaveBeenCalledWith(
                      threadMessage.id,
                      expect.any(Object),
                    );
                  });

                case 8:
                  _context14.next = 10;
                  return (0, _react2.waitFor)(function () {
                    expect(hasThreadMessages).toHaveBeenCalledWith(replies);
                  });

                case 10:
                case 'end':
                  return _context14.stop();
              }
            }
          }, _callee14);
        }),
      ),
    );
    it(
      'should allow closing a thread after it has been opened',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee15() {
          var threadHasClosed, threadMessage, threadHasAlreadyBeenOpened;
          return _regenerator.default.wrap(function _callee15$(_context15) {
            while (1) {
              switch ((_context15.prev = _context15.next)) {
                case 0:
                  threadHasClosed = false;
                  threadMessage = messages[0];
                  threadHasAlreadyBeenOpened = false;
                  renderComponent({}, function (_ref21) {
                    var thread = _ref21.thread,
                      openThread = _ref21.openThread,
                      closeThread = _ref21.closeThread;

                    if (!thread) {
                      // if there is no open thread
                      if (!threadHasAlreadyBeenOpened) {
                        // and we haven't opened one before, open a thread
                        openThread(threadMessage);
                        threadHasAlreadyBeenOpened = true;
                      } else {
                        // if we opened it ourselves before, it means the thread was succesfully closed
                        threadHasClosed = true;
                      }
                    } else {
                      // if a thread is open, close it.
                      closeThread();
                    }
                  });
                  _context15.next = 6;
                  return (0, _react2.waitFor)(function () {
                    return expect(threadHasClosed).toBe(true);
                  });

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
      'should call the onMentionsHover/onMentionsClick prop if a child component calls onMentionsHover with the right event',
      /*#__PURE__*/ (0, _asyncToGenerator2.default)(
        /*#__PURE__*/ _regenerator.default.mark(function _callee16() {
          var onMentionsHoverMock,
            onMentionsClickMock,
            username,
            mentionedUserMock,
            MentionedUserComponent,
            _renderComponent4,
            findByText,
            usernameText;

          return _regenerator.default.wrap(function _callee16$(_context16) {
            while (1) {
              switch ((_context16.prev = _context16.next)) {
                case 0:
                  onMentionsHoverMock = jest.fn();
                  onMentionsClickMock = jest.fn();
                  username = 'Mentioned User';
                  mentionedUserMock = {
                    name: username,
                  };

                  MentionedUserComponent = function MentionedUserComponent() {
                    var _useContext3 = (0, _react.useContext)(
                        _context35.ChannelContext,
                      ),
                      onMentionsHover = _useContext3.onMentionsHover;

                    return /*#__PURE__*/ _react.default.createElement(
                      'span',
                      {
                        onMouseOver: function onMouseOver(e) {
                          return onMentionsHover(e, [mentionedUserMock]);
                        },
                        onClick: function onClick(e) {
                          return onMentionsHover(e, [mentionedUserMock]);
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        'strong',
                        null,
                        '@',
                        username,
                      ),
                      ' this is a message',
                    );
                  };

                  (_renderComponent4 = renderComponent({
                    onMentionsHover: onMentionsHoverMock,
                    onMentionsClick: onMentionsClickMock,
                    children: /*#__PURE__*/ _react.default.createElement(
                      MentionedUserComponent,
                      null,
                    ),
                  })),
                    (findByText = _renderComponent4.findByText);
                  _context16.next = 8;
                  return findByText('@'.concat(username));

                case 8:
                  usernameText = _context16.sent;

                  _react2.fireEvent.mouseOver(usernameText);

                  _react2.fireEvent.click(usernameText);

                  _context16.next = 13;
                  return (0, _react2.waitFor)(function () {
                    return expect(onMentionsHoverMock).toHaveBeenCalledWith(
                      expect.any(Object), // event
                      mentionedUserMock,
                    );
                  });

                case 13:
                  _context16.next = 15;
                  return (0, _react2.waitFor)(function () {
                    return expect(onMentionsClickMock).toHaveBeenCalledWith(
                      expect.any(Object), // event
                      mentionedUserMock,
                    );
                  });

                case 15:
                case 'end':
                  return _context16.stop();
              }
            }
          }, _callee16);
        }),
      ),
    );
    describe('loading more messages', function () {
      var queryChannelWithNewMessages = function queryChannelWithNewMessages(
        newMessages,
      ) {
        // generate new channel mock from existing channel with new messages added
        return (0, _mockBuilders.getOrCreateChannelApi)(
          (0, _mockBuilders.generateChannel)({
            channel: {
              id: channel.id,
              type: channel.type,
              config: channel.getConfig(),
            },
            messages: newMessages,
          }),
        );
      };

      var limit = 10;
      it(
        'should be able to load more messages',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee17() {
            var channelQuerySpy, newMessageAdded, newMessages;
            return _regenerator.default.wrap(function _callee17$(_context17) {
              while (1) {
                switch ((_context17.prev = _context17.next)) {
                  case 0:
                    channelQuerySpy = jest.spyOn(channel, 'query');
                    newMessageAdded = false;
                    newMessages = [(0, _mockBuilders.generateMessage)()];
                    renderComponent({}, function (_ref24) {
                      var loadMore = _ref24.loadMore,
                        contextMessages = _ref24.messages;

                      if (
                        !contextMessages.find(function (message) {
                          return message.id === newMessages[0].id;
                        })
                      ) {
                        // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
                        (0, _mockBuilders.useMockedApis)(chatClient, [
                          queryChannelWithNewMessages(newMessages),
                        ]);
                        loadMore(limit);
                      } else {
                        // If message has been added, update checker so we can verify it happened.
                        newMessageAdded = true;
                      }
                    });
                    _context17.next = 6;
                    return (0, _react2.waitFor)(function () {
                      return expect(channelQuerySpy).toHaveBeenCalledWith({
                        messages: {
                          limit,
                          id_lt: messages[0].id,
                        },
                      });
                    });

                  case 6:
                    _context17.next = 8;
                    return (0, _react2.waitFor)(function () {
                      return expect(newMessageAdded).toBe(true);
                    });

                  case 8:
                  case 'end':
                    return _context17.stop();
                }
              }
            }, _callee17);
          }),
        ),
      );
      it(
        'should set hasMore to false if querying channel returns less messages than the limit',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee18() {
            var channelHasMore, newMessages;
            return _regenerator.default.wrap(function _callee18$(_context18) {
              while (1) {
                switch ((_context18.prev = _context18.next)) {
                  case 0:
                    channelHasMore = false;
                    newMessages = [(0, _mockBuilders.generateMessage)()];
                    renderComponent({}, function (_ref26) {
                      var loadMore = _ref26.loadMore,
                        contextMessages = _ref26.messages,
                        hasMore = _ref26.hasMore;

                      if (
                        !contextMessages.find(function (message) {
                          return message.id === newMessages[0].id;
                        })
                      ) {
                        // Our new message is not yet passed as part of channel context. Call loadMore and mock API response to include it.
                        (0, _mockBuilders.useMockedApis)(chatClient, [
                          queryChannelWithNewMessages(newMessages),
                        ]);
                        loadMore(limit);
                      } else {
                        // If message has been added, set our checker variable so we can verify if hasMore is false.
                        channelHasMore = hasMore;
                      }
                    });
                    _context18.next = 5;
                    return (0, _react2.waitFor)(function () {
                      return expect(channelHasMore).toBe(false);
                    });

                  case 5:
                  case 'end':
                    return _context18.stop();
                }
              }
            }, _callee18);
          }),
        ),
      );
      it(
        'should set hasMore to true if querying channel returns an amount of messages that equals the limit',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee19() {
            var channelHasMore, newMessages;
            return _regenerator.default.wrap(function _callee19$(_context19) {
              while (1) {
                switch ((_context19.prev = _context19.next)) {
                  case 0:
                    channelHasMore = false;
                    newMessages = Array(limit)
                      .fill(null)
                      .map(function () {
                        return (0, _mockBuilders.generateMessage)();
                      });
                    renderComponent({}, function (_ref28) {
                      var loadMore = _ref28.loadMore,
                        contextMessages = _ref28.messages,
                        hasMore = _ref28.hasMore;

                      if (
                        !contextMessages.some(function (message) {
                          return message.id === newMessages[0].id;
                        })
                      ) {
                        // Our new messages are not yet passed as part of channel context. Call loadMore and mock API response to include it.
                        (0, _mockBuilders.useMockedApis)(chatClient, [
                          queryChannelWithNewMessages(newMessages),
                        ]);
                        loadMore(limit);
                      } else {
                        // If message has been added, set our checker variable so we can verify if hasMore is true.
                        channelHasMore = hasMore;
                      }
                    });
                    _context19.next = 5;
                    return (0, _react2.waitFor)(function () {
                      return expect(channelHasMore).toBe(true);
                    });

                  case 5:
                  case 'end':
                    return _context19.stop();
                }
              }
            }, _callee19);
          }),
        ),
      );
      it(
        'should set loadingMore to true while loading more',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee20() {
            var queryPromise, isLoadingMore;
            return _regenerator.default.wrap(function _callee20$(_context20) {
              while (1) {
                switch ((_context20.prev = _context20.next)) {
                  case 0:
                    queryPromise = new Promise(function () {});
                    isLoadingMore = false;
                    renderComponent({}, function (_ref30) {
                      var loadingMore = _ref30.loadingMore,
                        loadMore = _ref30.loadMore;
                      // return a promise that hasn't resolved yet, so loadMore will be stuck in the 'await' part of the function
                      jest
                        .spyOn(channel, 'query')
                        .mockImplementationOnce(function () {
                          return queryPromise;
                        });
                      loadMore();
                      isLoadingMore = loadingMore;
                    });
                    _context20.next = 5;
                    return (0, _react2.waitFor)(function () {
                      return expect(isLoadingMore).toBe(true);
                    });

                  case 5:
                  case 'end':
                    return _context20.stop();
                }
              }
            }, _callee20);
          }),
        ),
      );
    });
    describe('Sending/removing/updating messages', function () {
      it(
        'should remove error messages from channel state when sending a new message',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee21() {
            var filterErrorMessagesSpy, hasSent;
            return _regenerator.default.wrap(function _callee21$(_context21) {
              while (1) {
                switch ((_context21.prev = _context21.next)) {
                  case 0:
                    filterErrorMessagesSpy = jest.spyOn(
                      channel.state,
                      'filterErrorMessages',
                    ); // flag to prevent infinite loop

                    hasSent = false;
                    renderComponent({}, function (_ref32) {
                      var sendMessage = _ref32.sendMessage;
                      if (!hasSent)
                        sendMessage({
                          text: 'message',
                        });
                      hasSent = true;
                    });
                    _context21.next = 5;
                    return (0, _react2.waitFor)(function () {
                      return expect(
                        filterErrorMessagesSpy,
                      ).toHaveBeenCalledWith();
                    });

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
        'should add a preview for messages that are sent to the channel state, so that they are rendered even without API response',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee22() {
            var hasSent, messageText, _renderComponent5, findByText;

            return _regenerator.default.wrap(function _callee22$(_context22) {
              while (1) {
                switch ((_context22.prev = _context22.next)) {
                  case 0:
                    // flag to prevent infinite loop
                    hasSent = false;
                    messageText = 'bla bla';
                    (_renderComponent5 = renderComponent(
                      {
                        children: /*#__PURE__*/ _react.default.createElement(
                          MockMessageList,
                          null,
                        ),
                      },
                      function (_ref34) {
                        var sendMessage = _ref34.sendMessage;
                        jest
                          .spyOn(channel, 'sendMessage')
                          .mockImplementationOnce(function () {
                            return new Promise(function () {});
                          });
                        if (!hasSent)
                          sendMessage({
                            text: messageText,
                          });
                        hasSent = true;
                      },
                    )),
                      (findByText = _renderComponent5.findByText);
                    _context22.t0 = expect;
                    _context22.next = 6;
                    return findByText(messageText);

                  case 6:
                    _context22.t1 = _context22.sent;
                    (0, _context22.t0)(_context22.t1).toBeInTheDocument();

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
        'should use the doSendMessageRequest prop to send messages if that is defined',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee23() {
            var hasSent, doSendMessageRequest, message;
            return _regenerator.default.wrap(function _callee23$(_context23) {
              while (1) {
                switch ((_context23.prev = _context23.next)) {
                  case 0:
                    // flag to prevent infinite loop
                    hasSent = false;
                    doSendMessageRequest = jest.fn(function () {
                      return new Promise(function () {});
                    });
                    message = {
                      text: 'message',
                    };
                    renderComponent(
                      {
                        doSendMessageRequest,
                      },
                      function (_ref36) {
                        var sendMessage = _ref36.sendMessage;
                        if (!hasSent) sendMessage(message);
                        hasSent = true;
                      },
                    );
                    _context23.next = 6;
                    return (0, _react2.waitFor)(function () {
                      return expect(doSendMessageRequest).toHaveBeenCalledWith(
                        channel.cid,
                        expect.objectContaining(message),
                      );
                    });

                  case 6:
                  case 'end':
                    return _context23.stop();
                }
              }
            }, _callee23);
          }),
        ),
      );
      it(
        'should eventually pass the result of the sendMessage API as part of ChannelContext',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee24() {
            var sentMessage,
              messageResponse,
              hasSent,
              _renderComponent6,
              findByText;

            return _regenerator.default.wrap(function _callee24$(_context24) {
              while (1) {
                switch ((_context24.prev = _context24.next)) {
                  case 0:
                    sentMessage = {
                      text: 'message',
                    };
                    messageResponse = {
                      text: 'different message',
                    };
                    hasSent = false;
                    (_renderComponent6 = renderComponent(
                      {
                        children: /*#__PURE__*/ _react.default.createElement(
                          MockMessageList,
                          null,
                        ),
                      },
                      function (_ref38) {
                        var sendMessage = _ref38.sendMessage;
                        (0, _mockBuilders.useMockedApis)(chatClient, [
                          (0, _mockBuilders.sendMessageApi)(
                            (0, _mockBuilders.generateMessage)(messageResponse),
                          ),
                        ]);
                        if (!hasSent) sendMessage(sentMessage);
                        hasSent = true;
                      },
                    )),
                      (findByText = _renderComponent6.findByText);
                    _context24.t0 = expect;
                    _context24.next = 7;
                    return findByText(messageResponse.text);

                  case 7:
                    _context24.t1 = _context24.sent;
                    (0, _context24.t0)(_context24.t1).toBeInTheDocument();

                  case 9:
                  case 'end':
                    return _context24.stop();
                }
              }
            }, _callee24);
          }),
        ),
      );
      it(
        'should enable editing messages',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee25() {
            var newText, updatedMessage, clientUpdateMessageSpy;
            return _regenerator.default.wrap(function _callee25$(_context25) {
              while (1) {
                switch ((_context25.prev = _context25.next)) {
                  case 0:
                    newText = 'something entirely different';
                    updatedMessage = _objectSpread(
                      _objectSpread({}, messages[0]),
                      {},
                      {
                        text: newText,
                      },
                    );
                    clientUpdateMessageSpy = jest.spyOn(
                      chatClient,
                      'updateMessage',
                    );
                    renderComponent({}, function (_ref40) {
                      var editMessage = _ref40.editMessage;
                      editMessage(updatedMessage);
                    });
                    _context25.next = 6;
                    return (0, _react2.waitFor)(function () {
                      return expect(
                        clientUpdateMessageSpy,
                      ).toHaveBeenCalledWith(updatedMessage);
                    });

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
        'should use doUpdateMessageRequest for the editMessage callback if provided',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee26() {
            var doUpdateMessageRequest;
            return _regenerator.default.wrap(function _callee26$(_context26) {
              while (1) {
                switch ((_context26.prev = _context26.next)) {
                  case 0:
                    doUpdateMessageRequest = jest.fn(function (
                      channelId,
                      message,
                    ) {
                      return message;
                    });
                    renderComponent(
                      {
                        doUpdateMessageRequest,
                      },
                      function (_ref42) {
                        var editMessage = _ref42.editMessage;
                        editMessage(messages[0]);
                      },
                    );
                    _context26.next = 4;
                    return (0, _react2.waitFor)(function () {
                      return expect(
                        doUpdateMessageRequest,
                      ).toHaveBeenCalledWith(channel.cid, messages[0]);
                    });

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
        'should update messages passed into the updaetMessage callback',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee27() {
            var newText,
              updatedMessage,
              hasUpdated,
              _renderComponent7,
              findByText;

            return _regenerator.default.wrap(function _callee27$(_context27) {
              while (1) {
                switch ((_context27.prev = _context27.next)) {
                  case 0:
                    newText = 'something entirely different';
                    updatedMessage = _objectSpread(
                      _objectSpread({}, messages[0]),
                      {},
                      {
                        text: newText,
                      },
                    );
                    hasUpdated = false;
                    (_renderComponent7 = renderComponent(
                      {
                        children: /*#__PURE__*/ _react.default.createElement(
                          MockMessageList,
                          null,
                        ),
                      },
                      function (_ref44) {
                        var updateMessage = _ref44.updateMessage;
                        if (!hasUpdated) updateMessage(updatedMessage);
                        hasUpdated = true;
                      },
                    )),
                      (findByText = _renderComponent7.findByText);
                    _context27.t0 = expect;
                    _context27.next = 7;
                    return findByText(updatedMessage.text);

                  case 7:
                    _context27.t1 = _context27.sent;
                    (0, _context27.t0)(_context27.t1).toBeInTheDocument();

                  case 9:
                  case 'end':
                    return _context27.stop();
                }
              }
            }, _callee27);
          }),
        ),
      );
      it(
        'should enable retrying message sending',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee28() {
            var hasSent,
              hasRetried,
              messageObject,
              _renderComponent8,
              findByText;

            return _regenerator.default.wrap(function _callee28$(_context28) {
              while (1) {
                switch ((_context28.prev = _context28.next)) {
                  case 0:
                    // flag to prevent infinite loop
                    hasSent = false;
                    hasRetried = false;
                    messageObject = {
                      text: 'bla bla',
                    };
                    (_renderComponent8 = renderComponent(
                      {
                        children: /*#__PURE__*/ _react.default.createElement(
                          MockMessageList,
                          null,
                        ),
                      },
                      function (_ref46) {
                        var sendMessage = _ref46.sendMessage,
                          retrySendMessage = _ref46.retrySendMessage,
                          contextMessages = _ref46.messages;

                        if (!hasSent) {
                          jest
                            .spyOn(channel, 'sendMessage')
                            .mockImplementationOnce(function () {
                              return Promise.reject();
                            });
                          sendMessage(messageObject);
                          hasSent = true;
                        } else if (
                          !hasRetried &&
                          contextMessages.some(function (_ref47) {
                            var status = _ref47.status;
                            return status === 'failed';
                          })
                        ) {
                          // retry
                          (0, _mockBuilders.useMockedApis)(chatClient, [
                            (0, _mockBuilders.sendMessageApi)(
                              (0, _mockBuilders.generateMessage)(messageObject),
                            ),
                          ]);
                          retrySendMessage(messageObject);
                          hasRetried = true;
                        }
                      },
                    )),
                      (findByText = _renderComponent8.findByText);
                    _context28.t0 = expect;
                    _context28.next = 7;
                    return findByText(messageObject.text);

                  case 7:
                    _context28.t1 = _context28.sent;
                    (0, _context28.t0)(_context28.t1).toBeInTheDocument();

                  case 9:
                  case 'end':
                    return _context28.stop();
                }
              }
            }, _callee28);
          }),
        ),
      );
      it(
        'should allow removing messages',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee29() {
            var allMessagesRemoved, removeSpy;
            return _regenerator.default.wrap(function _callee29$(_context29) {
              while (1) {
                switch ((_context29.prev = _context29.next)) {
                  case 0:
                    allMessagesRemoved = false;
                    removeSpy = jest.spyOn(channel.state, 'removeMessage');
                    renderComponent({}, function (_ref49) {
                      var removeMessage = _ref49.removeMessage,
                        contextMessages = _ref49.messages;

                      if (contextMessages.length > 0) {
                        // if there are messages passed as the context, remove them
                        removeMessage(contextMessages[0]);
                      } else {
                        // once they're all gone, set to true so we can verify that we no longer have messages
                        allMessagesRemoved = true;
                      }
                    });
                    _context29.next = 5;
                    return (0, _react2.waitFor)(function () {
                      return expect(removeSpy).toHaveBeenCalledWith(
                        messages[0],
                      );
                    });

                  case 5:
                    _context29.next = 7;
                    return (0, _react2.waitFor)(function () {
                      return expect(allMessagesRemoved).toBe(true);
                    });

                  case 7:
                  case 'end':
                    return _context29.stop();
                }
              }
            }, _callee29);
          }),
        ),
      );
    });
    describe('Channel events', function () {
      // note: these tests rely on Client.dispatchEvent, which eventually propagates to the channel component.
      var createOneTimeEventDispatcher = function createOneTimeEventDispatcher(
        event,
      ) {
        var hasDispatchedEvent = false;
        return function () {
          if (!hasDispatchedEvent)
            chatClient.dispatchEvent(
              _objectSpread(
                _objectSpread({}, event),
                {},
                {
                  cid: channel.cid,
                },
              ),
            );
          hasDispatchedEvent = true;
        };
      };

      var createChannelEventDispatcher = function createChannelEventDispatcher(
        body,
      ) {
        var type =
          arguments.length > 1 && arguments[1] !== undefined
            ? arguments[1]
            : 'message.new';
        return createOneTimeEventDispatcher(
          _objectSpread(
            {
              type,
            },
            body,
          ),
        );
      };

      it(
        'should eventually pass down a message when a message.new event is triggered on the channel',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee30() {
            var message, dispatchMessageEvent, _renderComponent9, findByText;

            return _regenerator.default.wrap(function _callee30$(_context30) {
              while (1) {
                switch ((_context30.prev = _context30.next)) {
                  case 0:
                    message = (0, _mockBuilders.generateMessage)({
                      user,
                    });
                    dispatchMessageEvent = createChannelEventDispatcher({
                      message,
                    });
                    (_renderComponent9 = renderComponent(
                      {
                        children: /*#__PURE__*/ _react.default.createElement(
                          MockMessageList,
                          null,
                        ),
                      },
                      function () {
                        // dispatch event in effect because it happens after active channel is set
                        dispatchMessageEvent();
                      },
                    )),
                      (findByText = _renderComponent9.findByText);
                    _context30.t0 = expect;
                    _context30.next = 6;
                    return findByText(message.text);

                  case 6:
                    _context30.t1 = _context30.sent;
                    (0, _context30.t0)(_context30.t1).toBeInTheDocument();

                  case 8:
                  case 'end':
                    return _context30.stop();
                }
              }
            }, _callee30);
          }),
        ),
      );
      it(
        'should mark the channel as read if a new message from another user comes in and the user is looking at the page',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee31() {
            var markReadSpy, message, dispatchMessageEvent;
            return _regenerator.default.wrap(function _callee31$(_context31) {
              while (1) {
                switch ((_context31.prev = _context31.next)) {
                  case 0:
                    markReadSpy = jest.spyOn(channel, 'markRead');
                    message = (0, _mockBuilders.generateMessage)({
                      user: (0, _mockBuilders.generateUser)(),
                    });
                    dispatchMessageEvent = createChannelEventDispatcher({
                      message,
                    });
                    renderComponent({}, function () {
                      dispatchMessageEvent();
                    });
                    _context31.next = 6;
                    return (0, _react2.waitFor)(function () {
                      return expect(markReadSpy).toHaveBeenCalledWith();
                    });

                  case 6:
                  case 'end':
                    return _context31.stop();
                }
              }
            }, _callee31);
          }),
        ),
      );
      it(
        'title of the page should include the unread count if the user is not looking at the page when a new message event happens',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee32() {
            var unreadAmount, message, dispatchMessageEvent;
            return _regenerator.default.wrap(function _callee32$(_context32) {
              while (1) {
                switch ((_context32.prev = _context32.next)) {
                  case 0:
                    unreadAmount = 1;
                    Object.defineProperty(document, 'hidden', {
                      configurable: true,
                      get: function get() {
                        return true;
                      },
                    });
                    jest
                      .spyOn(channel, 'countUnread')
                      .mockImplementation(function () {
                        return unreadAmount;
                      });
                    message = (0, _mockBuilders.generateMessage)({
                      user: (0, _mockBuilders.generateUser)(),
                    });
                    dispatchMessageEvent = createChannelEventDispatcher({
                      message,
                    });
                    renderComponent({}, function () {
                      dispatchMessageEvent();
                    });
                    _context32.next = 8;
                    return (0, _react2.waitFor)(function () {
                      return expect(document.title).toContain(
                        ''.concat(unreadAmount),
                      );
                    });

                  case 8:
                  case 'end':
                    return _context32.stop();
                }
              }
            }, _callee32);
          }),
        ),
      );
      it(
        'should update the `thread` parent message if an event comes in that modifies it',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee33() {
            var threadMessage,
              newText,
              updatedThreadMessage,
              dispatchUpdateMessageEvent,
              threadStarterHasUpdatedText;
            return _regenerator.default.wrap(function _callee33$(_context33) {
              while (1) {
                switch ((_context33.prev = _context33.next)) {
                  case 0:
                    threadMessage = messages[0];
                    newText = 'new text';
                    updatedThreadMessage = _objectSpread(
                      _objectSpread({}, threadMessage),
                      {},
                      {
                        text: newText,
                      },
                    );
                    dispatchUpdateMessageEvent = createChannelEventDispatcher(
                      {
                        message: updatedThreadMessage,
                      },
                      'message.update',
                    );
                    threadStarterHasUpdatedText = false;
                    renderComponent({}, function (_ref54) {
                      var openThread = _ref54.openThread,
                        thread = _ref54.thread;

                      if (!thread) {
                        // first, open thread
                        openThread(threadMessage);
                      } else if (thread.text !== newText) {
                        // then, update the thread message
                        // FIXME: dispatch event needs to be queued on event loop now
                        setTimeout(function () {
                          return dispatchUpdateMessageEvent();
                        }, 0);
                      } else {
                        threadStarterHasUpdatedText = true;
                      }
                    });
                    _context33.next = 8;
                    return (0, _react2.waitFor)(function () {
                      return expect(threadStarterHasUpdatedText).toBe(true);
                    });

                  case 8:
                  case 'end':
                    return _context33.stop();
                }
              }
            }, _callee33);
          }),
        ),
      );
      it(
        'should update the threadMessages if a new message comes in that is part of the thread',
        /*#__PURE__*/ (0, _asyncToGenerator2.default)(
          /*#__PURE__*/ _regenerator.default.mark(function _callee34() {
            var threadMessage,
              newThreadMessage,
              dispatchNewThreadMessageEvent,
              newThreadMessageWasAdded;
            return _regenerator.default.wrap(function _callee34$(_context34) {
              while (1) {
                switch ((_context34.prev = _context34.next)) {
                  case 0:
                    threadMessage = messages[0];
                    newThreadMessage = (0, _mockBuilders.generateMessage)({
                      parent_id: threadMessage.id,
                    });
                    dispatchNewThreadMessageEvent = createChannelEventDispatcher(
                      {
                        message: newThreadMessage,
                      },
                    );
                    newThreadMessageWasAdded = false;
                    renderComponent({}, function (_ref56) {
                      var openThread = _ref56.openThread,
                        thread = _ref56.thread,
                        threadMessages = _ref56.threadMessages;

                      if (!thread) {
                        // first, open thread
                        openThread(threadMessage);
                      } else if (
                        !threadMessages.some(function (_ref57) {
                          var id = _ref57.id;
                          return id === newThreadMessage.id;
                        })
                      ) {
                        // then, add new thread message
                        // FIXME: dispatch event needs to be queued on event loop now
                        setTimeout(function () {
                          return dispatchNewThreadMessageEvent();
                        }, 0);
                      } else {
                        newThreadMessageWasAdded = true;
                      }
                    });
                    _context34.next = 7;
                    return (0, _react2.waitFor)(function () {
                      return expect(newThreadMessageWasAdded).toBe(true);
                    });

                  case 7:
                  case 'end':
                    return _context34.stop();
                }
              }
            }, _callee34);
          }),
        ),
      );
    });
  });
});
