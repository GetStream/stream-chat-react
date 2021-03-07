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

var _useDeleteHandler = require('../useDeleteHandler');

var deleteMessage = jest.fn(function () {
  return Promise.resolve((0, _mockBuilders.generateMessage)());
});
var updateMessage = jest.fn();
var mouseEventMock = {
  preventDefault: jest.fn(function () {}),
};

function renderUseDeleteHandler() {
  return _renderUseDeleteHandler.apply(this, arguments);
}

function _renderUseDeleteHandler() {
  _renderUseDeleteHandler = (0, _asyncToGenerator2.default)(
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
              return (0, _mockBuilders.getTestClient)();

            case 3:
              client = _context5.sent;
              client.deleteMessage = deleteMessage;
              channel = (0, _mockBuilders.generateChannel)({
                updateMessage,
              });

              wrapper = function wrapper(_ref5) {
                var children = _ref5.children;
                return /*#__PURE__*/ _react.default.createElement(
                  _context6.ChannelContext.Provider,
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

              (_renderHook = (0, _reactHooks.renderHook)(
                function () {
                  return (0, _useDeleteHandler.useDeleteHandler)(message);
                },
                {
                  wrapper,
                },
              )),
                (result = _renderHook.result);
              return _context5.abrupt('return', result.current);

            case 9:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5);
    }),
  );
  return _renderUseDeleteHandler.apply(this, arguments);
}

describe('useDeleteHandler custom hook', function () {
  afterEach(jest.clearAllMocks);
  it(
    'should generate function that handles message deletion',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var handleDelete;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderUseDeleteHandler();

              case 2:
                handleDelete = _context.sent;
                expect(typeof handleDelete).toBe('function');

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
    'should prevent default mouse click event from bubbling',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var handleDelete;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return renderUseDeleteHandler();

              case 2:
                handleDelete = _context2.sent;
                _context2.next = 5;
                return handleDelete(mouseEventMock);

              case 5:
                expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();

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
    'should delete a message by its id',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var message, handleDelete;
        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                _context3.next = 3;
                return renderUseDeleteHandler(message);

              case 3:
                handleDelete = _context3.sent;
                _context3.next = 6;
                return handleDelete(mouseEventMock);

              case 6:
                expect(deleteMessage).toHaveBeenCalledWith(message.id);

              case 7:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3);
      }),
    ),
  );
  it(
    'should update the message with the result of deletion',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var message, deletedMessage, handleDelete;
        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                message = (0, _mockBuilders.generateMessage)();
                deletedMessage = (0, _mockBuilders.generateMessage)();
                deleteMessage.mockImplementationOnce(function () {
                  return Promise.resolve({
                    message: deletedMessage,
                  });
                });
                _context4.next = 5;
                return renderUseDeleteHandler(message);

              case 5:
                handleDelete = _context4.sent;
                _context4.next = 8;
                return handleDelete(mouseEventMock);

              case 8:
                expect(updateMessage).toHaveBeenCalledWith(deletedMessage);

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
});
