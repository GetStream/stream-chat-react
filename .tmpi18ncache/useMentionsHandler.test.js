'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _context = require('../../../../context');

var _useMentionsHandler = require('../useMentionsHandler');

var onMentionsClickMock = jest.fn();
var onMentionsHoverMock = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function generateHookHandler(hook) {
  return function (message, hookOptions) {
    var onMentionsClick =
      arguments.length > 2 && arguments[2] !== undefined
        ? arguments[2]
        : onMentionsClickMock;
    var onMentionsHover =
      arguments.length > 3 && arguments[3] !== undefined
        ? arguments[3]
        : onMentionsHoverMock;

    var wrapper = function wrapper(_ref) {
      var children = _ref.children;
      return /*#__PURE__*/ _react.default.createElement(
        _context.ChannelContext.Provider,
        {
          value: {
            onMentionsClick,
            onMentionsHover,
          },
        },
        children,
      );
    };

    var _renderHook = (0, _reactHooks.renderHook)(
        function () {
          return hook(message, hookOptions);
        },
        {
          wrapper,
        },
      ),
      result = _renderHook.result;

    return result.current;
  };
}

var renderUseMentionsHandlerHook = generateHookHandler(
  _useMentionsHandler.useMentionsHandler,
);
describe('useMentionsHandler custom hooks', function () {
  afterEach(jest.clearAllMocks);
  it('should return a function', function () {
    var handleMentions = renderUseMentionsHandlerHook();
    expect(handleMentions).toStrictEqual({
      onMentionsClick: expect.any(Function),
      onMentionsHover: expect.any(Function),
    });
  });
  it("should call onMentionsClick with message's mentioned users when user clicks on a mention", function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsHan = renderUseMentionsHandlerHook(message),
      onMentionsClick = _renderUseMentionsHan.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
  it('should not call onMentionsClick when it is not defined', function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsHan2 = renderUseMentionsHandlerHook(
        message,
        {},
        null,
      ),
      onMentionsClick = _renderUseMentionsHan2.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
  });
  it('should not call onMentionsClick when it message has no mentioned users set', function () {
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users: null,
    });

    var _renderUseMentionsHan3 = renderUseMentionsHandlerHook(message),
      onMentionsClick = _renderUseMentionsHan3.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).not.toHaveBeenCalled();
  });
  it("should call onMentionsHover with message's mentioned users when user hovers on a mention", function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsHan4 = renderUseMentionsHandlerHook(message),
      onMentionsHover = _renderUseMentionsHan4.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
  it('should not call onMentionsHover when it is not defined', function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsHan5 = renderUseMentionsHandlerHook(
        message,
        {},
        onMentionsClickMock,
        null,
      ),
      onMentionsHover = _renderUseMentionsHan5.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });
  it('should not call onMentionsHover when message has no mentioned users set', function () {
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users: null,
    });

    var _renderUseMentionsHan6 = renderUseMentionsHandlerHook(message),
      onMentionsHover = _renderUseMentionsHan6.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).not.toHaveBeenCalled();
  });
  it('should call the custom mention hover handler when one is set', function () {
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });
    var onMentionsHoverHandler = jest.fn();

    var _renderUseMentionsHan7 = renderUseMentionsHandlerHook(message, {
        onMentionsHover: onMentionsHoverHandler,
      }),
      onMentionsHover = _renderUseMentionsHan7.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
  it('should call the custom mention click handler when one is set', function () {
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });
    var onMentionsClickHandler = jest.fn();

    var _renderUseMentionsHan8 = renderUseMentionsHandlerHook(message, {
        onMentionsClick: onMentionsClickHandler,
      }),
      onMentionsClick = _renderUseMentionsHan8.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(onMentionsClickHandler).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
});
var renderUseMentionsUIHandlerHook = generateHookHandler(
  _useMentionsHandler.useMentionsUIHandler,
);
describe('useMentionsUIHandler', function () {
  afterEach(jest.clearAllMocks);
  it('should return a function', function () {
    var handleMentions = renderUseMentionsUIHandlerHook();
    expect(handleMentions).toStrictEqual({
      onMentionsClick: expect.any(Function),
      onMentionsHover: expect.any(Function),
    });
  });
  it("should call onMentionsClick with message's mentioned users when user clicks on a mention", function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsUIH = renderUseMentionsUIHandlerHook(message),
      onMentionsClick = _renderUseMentionsUIH.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(onMentionsClickMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
  it("should call onMentionsHover with message's mentioned users when user hovers on a mention", function () {
    var alice = (0, _mockBuilders.generateUser)();
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [alice, bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });

    var _renderUseMentionsUIH2 = renderUseMentionsUIHandlerHook(message),
      onMentionsHover = _renderUseMentionsUIH2.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(onMentionsHoverMock).toHaveBeenCalledWith(
      mouseEventMock,
      mentioned_users,
    );
  });
  it('should call the custom message mention click processor when one is set', function () {
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });
    var customMentionClickHandler = jest.fn();

    var _renderUseMentionsUIH3 = renderUseMentionsUIHandlerHook(message, {
        onMentionsClick: customMentionClickHandler,
      }),
      onMentionsClick = _renderUseMentionsUIH3.onMentionsClick;

    onMentionsClick(mouseEventMock);
    expect(customMentionClickHandler).toHaveBeenCalledWith(mouseEventMock);
  });
  it('should call the custom message mention hover handler when one is set', function () {
    var bob = (0, _mockBuilders.generateUser)();
    var mentioned_users = [bob];
    var message = (0, _mockBuilders.generateMessage)({
      mentioned_users,
    });
    var customMentionsHover = jest.fn();

    var _renderUseMentionsUIH4 = renderUseMentionsUIHandlerHook(message, {
        onMentionsHover: customMentionsHover,
      }),
      onMentionsHover = _renderUseMentionsUIH4.onMentionsHover;

    onMentionsHover(mouseEventMock);
    expect(customMentionsHover).toHaveBeenCalledWith(mouseEventMock);
  });
});
