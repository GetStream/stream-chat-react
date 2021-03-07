'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _context = require('../../../../context');

var _useRetryHandler = require('../useRetryHandler');

var retrySendMessage = jest.fn();

function renderUseRetryHandlerHook(customRetrySendMessage) {
  var wrapper = function wrapper(_ref) {
    var children = _ref.children;
    return /*#__PURE__*/ _react.default.createElement(
      _context.ChannelContext.Provider,
      {
        value: {
          retrySendMessage,
        },
      },
      children,
    );
  };

  var _renderHook = (0, _reactHooks.renderHook)(
      function () {
        return (0, _useRetryHandler.useRetryHandler)(customRetrySendMessage);
      },
      {
        wrapper,
      },
    ),
    result = _renderHook.result;

  return result.current;
}

describe('useReactionHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it('should generate a function that handles retrying a failed message', function () {
    var handleRetry = renderUseRetryHandlerHook();
    expect(typeof handleRetry).toBe('function');
  });
  it('should retry send message when called', function () {
    var handleRetry = renderUseRetryHandlerHook();
    var message = (0, _mockBuilders.generateMessage)();
    handleRetry(message);
    expect(retrySendMessage).toHaveBeenCalledWith(message);
  });
  it('should retry send message with custom retry send message handler when one is set', function () {
    var customRetrySendMessage = jest.fn();
    var handleRetry = renderUseRetryHandlerHook(customRetrySendMessage);
    var message = (0, _mockBuilders.generateMessage)();
    handleRetry(message);
    expect(retrySendMessage).not.toHaveBeenCalled();
    expect(customRetrySendMessage).toHaveBeenCalledWith(message);
  });
  it('should do nothing if message is not defined', function () {
    var handleRetry = renderUseRetryHandlerHook();
    handleRetry(undefined);
    expect(retrySendMessage).not.toHaveBeenCalled();
  });
});
