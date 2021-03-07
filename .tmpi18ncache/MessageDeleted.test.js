'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('mock-builders');

var _MessageDeleted = _interopRequireDefault(require('../MessageDeleted'));

var _context6 = require('../../../context');

var alice = (0, _mockBuilders.generateUser)();
var bob = (0, _mockBuilders.generateUser)();

function renderComponent() {
  return _renderComponent.apply(this, arguments);
}

function _renderComponent() {
  _renderComponent = (0, _asyncToGenerator2.default)(
    /*#__PURE__*/ _regenerator.default.mark(function _callee5() {
      var message,
        t,
        client,
        _args5 = arguments;
      return _regenerator.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch ((_context5.prev = _context5.next)) {
            case 0:
              message =
                _args5.length > 0 && _args5[0] !== undefined
                  ? _args5[0]
                  : (0, _mockBuilders.generateMessage)();
              t = jest.fn(function (key) {
                return key;
              });
              _context5.next = 4;
              return (0, _mockBuilders.getTestClientWithUser)(alice);

            case 4:
              client = _context5.sent;
              return _context5.abrupt(
                'return',
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _context6.ChannelContext.Provider,
                    {
                      value: {
                        client,
                      },
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _context6.TranslationContext.Provider,
                      {
                        value: {
                          t,
                        },
                      },
                      /*#__PURE__*/ _react.default.createElement(
                        _MessageDeleted.default,
                        {
                          message: message,
                        },
                      ),
                    ),
                  ),
                ),
              );

            case 6:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5);
    }),
  );
  return _renderComponent.apply(this, arguments);
}

var messageDeletedTestId = 'message-deleted-component';
var ownMessageCssClass = 'str-chat__message--me';
describe('MessageDeleted component', function () {
  it(
    'should inform that the message was deleted',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var _yield$renderComponen, queryByText;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return renderComponent();

              case 2:
                _yield$renderComponen = _context.sent;
                queryByText = _yield$renderComponen.queryByText;
                expect(
                  queryByText('This message was deleted...'),
                ).toBeInTheDocument();

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it(
    'should set specific css class when message is from current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _yield$renderComponen2, queryByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return renderComponent(
                  (0, _mockBuilders.generateMessage)({
                    user: alice,
                  }),
                );

              case 2:
                _yield$renderComponen2 = _context2.sent;
                queryByTestId = _yield$renderComponen2.queryByTestId;
                expect(queryByTestId(messageDeletedTestId).className).toContain(
                  ownMessageCssClass,
                );

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
  it(
    'should not set specific css class when message is not from current user',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee3() {
        var _yield$renderComponen3, queryByTestId;

        return _regenerator.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.next = 2;
                return renderComponent(
                  (0, _mockBuilders.generateMessage)({
                    user: bob,
                  }),
                );

              case 2:
                _yield$renderComponen3 = _context3.sent;
                queryByTestId = _yield$renderComponen3.queryByTestId;
                expect(
                  queryByTestId(messageDeletedTestId).className,
                ).not.toContain(ownMessageCssClass);

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
    'should set specific css class based on message type',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee4() {
        var type, _yield$renderComponen4, queryByTestId;

        return _regenerator.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch ((_context4.prev = _context4.next)) {
              case 0:
                type = 'message.read';
                _context4.next = 3;
                return renderComponent(
                  (0, _mockBuilders.generateMessage)({
                    type,
                  }),
                );

              case 3:
                _yield$renderComponen4 = _context4.sent;
                queryByTestId = _yield$renderComponen4.queryByTestId;
                expect(queryByTestId(messageDeletedTestId).className).toContain(
                  type,
                );

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4);
      }),
    ),
  );
});
