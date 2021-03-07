'use strict';

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

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _context8 = require('../../../../context');

var _useReactionHandler = require('../useReactionHandler');

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

var getConfig = jest.fn();
var sendAction = jest.fn();
var sendReaction = jest.fn();
var deleteReaction = jest.fn();
var updateMessage = jest.fn();
var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var bob = (0, _mockBuilders.generateUser)({
  name: 'bob',
});

function renderUseReactionHandlerHook() {
  return _renderUseReactionHandlerHook.apply(this, arguments);
}

function _renderUseReactionHandlerHook() {
  _renderUseReactionHandlerHook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee7() {
      var message,
        channelContextProps,
        client,
        channel,
        wrapper,
        _renderHook3,
        result,
        _args7 = arguments;

      return _regenerator.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch ((_context7.prev = _context7.next)) {
            case 0:
              message =
                _args7.length > 0 && _args7[0] !== undefined
                  ? _args7[0]
                  : (0, _mockBuilders.generateMessage)();
              channelContextProps = _args7.length > 1 ? _args7[1] : undefined;
              _context7.next = 4;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 4:
              client = _context7.sent;
              channel = (0, _mockBuilders.generateChannel)(
                _objectSpread(
                  {
                    getConfig,
                    sendAction,
                    sendReaction,
                    deleteReaction,
                  },
                  channelContextProps,
                ),
              );

              wrapper = function wrapper(_ref9) {
                var children = _ref9.children;
                return /*#__PURE__*/ _react.default.createElement(
                  _context8.ChannelContext.Provider,
                  {
                    value: {
                      channel,
                      client,
                      updateMessage,
                    },
                  },
                  children,
                );
              };

              (_renderHook3 = (0, _reactHooks.renderHook)(
                function () {
                  return (0, _useReactionHandler.useReactionHandler)(message);
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook3.result);
              return _context7.abrupt('return', result.current);

            case 9:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7);
    }),
  );
  return _renderUseReactionHandlerHook.apply(this, arguments);
}

describe('useReactionHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it(
    'should generate function that handles reactions',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var handleReaction;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderUseReactionHandlerHook();

              case 2:
                handleReaction = _context.sent;
                expect(typeof handleReaction).toBe('function');

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should warn user if the hooks was not initialized with a defined message',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var handleReaction;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                jest.spyOn(console, 'warn').mockImplementationOnce(function () {
                  return null;
                });
                _context2.next = 3;
                return renderUseReactionHandlerHook(null);

              case 3:
                handleReaction = _context2.sent;
                _context2.next = 6;
                return handleReaction();

              case 6:
                expect(console.warn).toHaveBeenCalledWith(
                  _useReactionHandler.reactionHandlerWarning,
                );

              case 7:
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
        var reaction, message, handleReaction;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                jest.spyOn(console, 'warn').mockImplementationOnce(function () {
                  return null;
                });
                reaction = (0, _mockBuilders.generateReaction)({
                  user: bob,
                });
                message = (0, _mockBuilders.generateMessage)({
                  own_reactions: [reaction],
                });
                _context3.next = 5;
                return renderUseReactionHandlerHook(message);

              case 5:
                handleReaction = _context3.sent;
                _context3.next = 8;
                return handleReaction();

              case 8:
                expect(console.warn).toHaveBeenCalledWith(
                  'message.own_reactions contained reactions from a different user, this indicates a bug',
                );

              case 9:
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
        var reaction, message, handleReaction;
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
                return renderUseReactionHandlerHook(message);

              case 4:
                handleReaction = _context4.sent;
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
        var reaction, message, handleReaction;
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
                return renderUseReactionHandlerHook(message);

              case 4:
                handleReaction = _context5.sent;
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
        var reaction, message, handleReaction;
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
                _context6.next = 4;
                return renderUseReactionHandlerHook(message);

              case 4:
                handleReaction = _context6.sent;
                sendReaction.mockImplementationOnce(function () {
                  return Promise.reject();
                });
                _context6.next = 8;
                return handleReaction(reaction.type);

              case 8:
                expect(updateMessage).toHaveBeenCalledWith(message);

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6);
      }),
    ),
  );
});

function renderUseReactionClickHook() {
  var message =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : (0, _mockBuilders.generateMessage)();
  var reactionListRef =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : /*#__PURE__*/ _react.default.createRef();
  var messageWrapperRef =
    arguments.length > 2 && arguments[2] !== undefined
      ? arguments[2]
      : /*#__PURE__*/ _react.default.createRef();

  var wrapper = function wrapper(_ref7) {
    var children = _ref7.children;
    return /*#__PURE__*/ _react.default.createElement('div', null, children);
  };

  var _renderHook = (0, _reactHooks.renderHook)(
      function () {
        return (0, _useReactionHandler.useReactionClick)(
          message,
          reactionListRef,
          messageWrapperRef,
        );
      },
      {
        wrapper,
      },
    ),
    result = _renderHook.result,
    rerender = _renderHook.rerender;

  return {
    result,
    rerender,
  };
}

describe('useReactionClick custom hook', function () {
  beforeEach(jest.clearAllMocks);
  it('should initialize a click handler and a flag for showing detailed reactions', function () {
    var _renderUseReactionCli = renderUseReactionClickHook(),
      current = _renderUseReactionCli.result.current;

    expect(typeof current.onReactionListClick).toBe('function');
    expect(current.showDetailedReactions).toBe(false);
  });
  it('should set show details to true on click', function () {
    var _renderUseReactionCli2 = renderUseReactionClickHook(),
      result = _renderUseReactionCli2.result;

    expect(result.current.showDetailedReactions).toBe(false);
    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick();
    });
    expect(result.current.showDetailedReactions).toBe(true);
  });
  it('should retrun correct value for isReactionEnabled', function () {
    var channel = (0, _mockBuilders.generateChannel)({
      getConfig: function getConfig() {
        return {
          reactions: false,
        };
      },
    });

    var _renderHook2 = (0, _reactHooks.renderHook)(
        function () {
          return (0, _useReactionHandler.useReactionClick)(
            (0, _mockBuilders.generateMessage)(),
            /*#__PURE__*/ _react.default.createRef(),
            /*#__PURE__*/ _react.default.createRef(),
          );
        },
        {
          // eslint-disable-next-line react/display-name
          wrapper: function wrapper(_ref8) {
            var children = _ref8.children;
            return /*#__PURE__*/ _react.default.createElement(
              _context8.ChannelContext.Provider,
              {
                value: {
                  channel,
                },
              },
              children,
            );
          },
        },
      ),
      result = _renderHook2.result,
      rerender = _renderHook2.rerender;

    expect(result.current.isReactionEnabled).toBe(false);

    channel.getConfig = function () {
      return {
        reactions: true,
      };
    };

    rerender();
    expect(result.current.isReactionEnabled).toBe(true);

    channel.getConfig = function () {
      return null;
    };

    rerender();
    expect(result.current.isReactionEnabled).toBe(true);
  });
  it('should set event listener to close reaction list on document click when list is opened', function () {
    var clickMock = {
      target: document.createElement('div'),
    };

    var _renderUseReactionCli3 = renderUseReactionClickHook(),
      result = _renderUseReactionCli3.result;

    var onDocumentClick;
    var addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn(function (_, fn) {
          onDocumentClick = fn;
        }),
      );
    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick();
    });
    expect(result.current.showDetailedReactions).toBe(true);
    expect(document.addEventListener).toHaveBeenCalledTimes(2);
    expect(document.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function),
    );
    (0, _reactHooks.act)(function () {
      return onDocumentClick(clickMock);
    });
    expect(result.current.showDetailedReactions).toBe(false);
    addEventListenerSpy.mockRestore();
  });
  it('should set event listener to message wrapper reference when one is set', function () {
    var mockMessageWrapperReference = {
      current: {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      },
    };

    var _renderUseReactionCli4 = renderUseReactionClickHook(
        (0, _mockBuilders.generateMessage)(),
        /*#__PURE__*/ _react.default.createRef(),
        mockMessageWrapperReference,
      ),
      result = _renderUseReactionCli4.result;

    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick();
    });
    expect(
      mockMessageWrapperReference.current.addEventListener,
    ).toHaveBeenCalledWith('mouseleave', expect.any(Function));
  });
  it('should not close reaction list on document click when click is on the reaction list itself', function () {
    var message = (0, _mockBuilders.generateMessage)();
    var reactionSelectorEl = document.createElement('div');
    var reactionListElement = document
      .createElement('div')
      .appendChild(reactionSelectorEl);
    var clickMock = {
      target: reactionSelectorEl,
    };

    var _renderUseReactionCli5 = renderUseReactionClickHook(message, {
        current: reactionListElement,
      }),
      result = _renderUseReactionCli5.result;

    var onDocumentClick;
    var addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn(function (_, fn) {
          onDocumentClick = fn;
        }),
      );
    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick();
    });
    expect(result.current.showDetailedReactions).toBe(true);
    (0, _reactHooks.act)(function () {
      return onDocumentClick(clickMock);
    });
    expect(result.current.showDetailedReactions).toBe(true);
    addEventListenerSpy.mockRestore();
  });
  it('should remove close click event listeners after reaction list is closed', function () {
    var clickMock = {
      target: document.createElement('div'),
    };

    var _renderUseReactionCli6 = renderUseReactionClickHook(),
      result = _renderUseReactionCli6.result;

    var onDocumentClick;
    var addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn(function (_, fn) {
          onDocumentClick = fn;
        }),
      );
    var removeEventListenerSpy = jest
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(jest.fn());
    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick();
    });
    expect(result.current.showDetailedReactions).toBe(true);
    (0, _reactHooks.act)(function () {
      return onDocumentClick(clickMock);
    });
    expect(result.current.showDetailedReactions).toBe(false);
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      onDocumentClick,
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      onDocumentClick,
    );
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
  it('should remove close click event listeners if message is deleted', function () {
    var clickMock = {
      target: document.createElement('div'),
    };
    var message = (0, _mockBuilders.generateMessage)();
    var onDocumentClick;
    var addEventListenerSpy = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation(
        jest.fn(function (_, fn) {
          onDocumentClick = fn;
        }),
      );
    var removeEventListenerSpy = jest
      .spyOn(document, 'removeEventListener')
      .mockImplementationOnce(jest.fn());

    var _renderUseReactionCli7 = renderUseReactionClickHook(message),
      result = _renderUseReactionCli7.result,
      rerender = _renderUseReactionCli7.rerender;

    expect(document.removeEventListener).not.toHaveBeenCalled();
    (0, _reactHooks.act)(function () {
      return result.current.onReactionListClick(clickMock);
    });
    message.deleted_at = new Date();
    rerender();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'click',
      onDocumentClick,
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'touchend',
      onDocumentClick,
    );
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});
