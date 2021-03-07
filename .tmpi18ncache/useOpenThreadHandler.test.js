'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _context = require('../../../../context');

var _useOpenThreadHandler = require('../useOpenThreadHandler');

var openThreadMock = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseOpenThreadHandlerHook() {
  var message =
    arguments.length > 0 && arguments[0] !== undefined
      ? arguments[0]
      : (0, _mockBuilders.generateMessage)();
  var openThread =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : openThreadMock;

  var wrapper = function wrapper(_ref) {
    var children = _ref.children;
    return /*#__PURE__*/ _react.default.createElement(
      _context.ChannelContext.Provider,
      {
        value: {
          openThread,
        },
      },
      children,
    );
  };

  var _renderHook = (0, _reactHooks.renderHook)(
      function () {
        return (0, _useOpenThreadHandler.useOpenThreadHandler)(message);
      },
      {
        wrapper,
      },
    ),
    result = _renderHook.result;

  return result.current;
}

describe('useOpenThreadHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it('should return a function', function () {
    var handleOpenThread = renderUseOpenThreadHandlerHook();
    expect(typeof handleOpenThread).toBe('function');
  });
  it('should allow user to open a thread', function () {
    var message = (0, _mockBuilders.generateMessage)();
    var handleOpenThread = renderUseOpenThreadHandlerHook(message);
    handleOpenThread(mouseEventMock);
    expect(openThreadMock).toHaveBeenCalledWith(message, mouseEventMock);
  });
  it('should warn user if it is called without a message', function () {
    jest.spyOn(console, 'warn').mockImplementationOnce(function () {});
    var handleOpenThread = renderUseOpenThreadHandlerHook(null);
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
  it('should warn user if it open thread is not defined in the channel context', function () {
    jest.spyOn(console, 'warn').mockImplementationOnce(function () {});
    var handleOpenThread = renderUseOpenThreadHandlerHook(
      (0, _mockBuilders.generateMessage)(),
      null,
    );
    handleOpenThread(mouseEventMock);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
  it('should allow user to open a thread with a custom thread handler if one is set', function () {
    var message = (0, _mockBuilders.generateMessage)();
    var customThreadHandler = jest.fn();
    var handleOpenThread = renderUseOpenThreadHandlerHook(
      message,
      customThreadHandler,
    );
    handleOpenThread(mouseEventMock);
    expect(customThreadHandler).toHaveBeenCalledWith(message, mouseEventMock);
    expect(openThreadMock).not.toHaveBeenCalled();
  });
});
