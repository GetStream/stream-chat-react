'use strict';

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _useUserHandler = require('../useUserHandler');

var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseUserHandlerHook() {
  var message =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : (0, _mockBuilders.generateMessage)();
  var eventHandlers = arguments.length > 1 ? arguments[1] : undefined;

  var _renderHook = (0, _reactHooks.renderHook)(function () {
      return (0, _useUserHandler.useUserHandler)(message, eventHandlers);
    }),
    result = _renderHook.result;

  return result.current;
}

describe('useUserHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it('should return a handlers for mouse events on the Avatar child component', function () {
    var handleUserEvents = renderUseUserHandlerHook();
    expect(handleUserEvents).toStrictEqual({
      onUserClick: expect.any(Function),
      onUserHover: expect.any(Function),
    });
  });
  it('should call user click handler with user message', function () {
    var user = (0, _mockBuilders.generateUser)();
    var message = (0, _mockBuilders.generateMessage)({
      user,
    });
    var customUserClickHandler = jest.fn();

    var _renderUseUserHandler = renderUseUserHandlerHook(message, {
        onUserClickHandler: customUserClickHandler,
      }),
      onUserClick = _renderUseUserHandler.onUserClick;

    onUserClick(mouseEventMock);
    expect(customUserClickHandler).toHaveBeenCalledWith(mouseEventMock, user);
  });
  it('should call user hover handler with user message', function () {
    var user = (0, _mockBuilders.generateUser)();
    var message = (0, _mockBuilders.generateMessage)({
      user,
    });
    var customUserHoverHandler = jest.fn();

    var _renderUseUserHandler2 = renderUseUserHandlerHook(message, {
        onUserHoverHandler: customUserHoverHandler,
      }),
      onUserHover = _renderUseUserHandler2.onUserHover;

    onUserHover(mouseEventMock);
    expect(customUserHoverHandler).toHaveBeenCalledWith(mouseEventMock, user);
  });
  it('should not throw if no custom handler is set and handler is called', function () {
    var user = (0, _mockBuilders.generateUser)();
    var message = (0, _mockBuilders.generateMessage)({
      user,
    });

    var _renderUseUserHandler3 = renderUseUserHandlerHook(message),
      onUserClick = _renderUseUserHandler3.onUserClick,
      onUserHover = _renderUseUserHandler3.onUserHover;

    expect(function () {
      return onUserClick(mouseEventMock);
    }).not.toThrow();
    expect(function () {
      return onUserHover(mouseEventMock);
    }).not.toThrow();
  });
});
