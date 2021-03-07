'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _reactHooks = require('@testing-library/react-hooks');

var _mockBuilders = require('mock-builders');

var _context6 = require('../../../../context');

var _useActionHandler = require('../useActionHandler');

var alice = (0, _mockBuilders.generateUser)({
  name: 'alice',
});
var sendAction = jest.fn();
var removeMessage = jest.fn();
var updateMessage = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseHandleActionHook() {
  return _renderUseHandleActionHook.apply(this, arguments);
}

function _renderUseHandleActionHook() {
  _renderUseHandleActionHook = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
      var message,
        client,
        channel,
        wrapper,
        _renderHook,
        result,
        _args5 = arguments;

      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch ((_context5.prev = _context5.next)) {
            case 0:
              message =
                _args5.length > 0 && _args5[0] !== undefined
                  ? _args5[0]
                  : (0, _mockBuilders.generateMessage)();
              _context5.next = 3;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 3:
              client = _context5.sent;
              channel = (0, _mockBuilders.generateChannel)({
                sendAction,
              });

              wrapper = function wrapper(_ref5) {
                var children = _ref5.children;
                return /*#__PURE__*/ _react.default.createElement(
                  _context6.ChannelContext.Provider,
                  {
                    value: {
                      channel,
                      client,
                      removeMessage,
                      updateMessage,
                    },
                  },
                  children,
                );
              };

              (_renderHook = (0, _reactHooks.renderHook)(
                function () {
                  return (0, _useActionHandler.useActionHandler)(message);
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook.result);
              return _context5.abrupt('return', result.current);

            case 8:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5);
    }),
  );
  return _renderUseHandleActionHook.apply(this, arguments);
}

describe('useHandleAction custom hook', function () {
  afterEach(jest.clearAllMocks);
  it(
    'should return function that handles actions',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var handleAction;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderUseHandleActionHook();

              case 2:
                handleAction = _context.sent;
                expect(typeof handleAction).toBe('function');

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
        var handleAction;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                jest.spyOn(console, 'warn').mockImplementationOnce(function () {
                  return null;
                });
                _context2.next = 3;
                return renderUseHandleActionHook(null);

              case 3:
                handleAction = _context2.sent;
                _context2.next = 6;
                return handleAction('action', 'value', mouseEventMock);

              case 6:
                expect(console.warn).toHaveBeenCalledWith(
                  _useActionHandler.handleActionWarning,
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
    'should update message after an action',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var currentMessage, updatedMessage, action, handleAction;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                currentMessage = (0, _mockBuilders.generateMessage)();
                updatedMessage = (0, _mockBuilders.generateMessage)();
                action = {
                  name: 'action',
                  value: 'value',
                };
                sendAction.mockImplementationOnce(function () {
                  return Promise.resolve({
                    message: updatedMessage,
                  });
                });
                _context3.next = 6;
                return renderUseHandleActionHook(currentMessage);

              case 6:
                handleAction = _context3.sent;
                _context3.next = 9;
                return handleAction(action.name, action.value, mouseEventMock);

              case 9:
                expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
                  [action.name]: action.value,
                });
                expect(updateMessage).toHaveBeenCalledWith(updatedMessage);

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should fallback to original message after an action fails',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var currentMessage, action, handleAction;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                currentMessage = (0, _mockBuilders.generateMessage)();
                action = {
                  name: 'action',
                  value: 'value',
                };
                sendAction.mockImplementationOnce(function () {
                  return Promise.resolve(undefined);
                });
                _context4.next = 5;
                return renderUseHandleActionHook(currentMessage);

              case 5:
                handleAction = _context4.sent;
                _context4.next = 8;
                return handleAction(action.name, action.value, mouseEventMock);

              case 8:
                expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
                  [action.name]: action.value,
                });
                expect(removeMessage).toHaveBeenCalledWith(currentMessage);

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
});
