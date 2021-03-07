'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _regenerator = _interopRequireDefault(
  require('@babel/runtime/regenerator'),
);

var _asyncToGenerator2 = _interopRequireDefault(
  require('@babel/runtime/helpers/asyncToGenerator'),
);

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _mockBuilders = require('../../../mock-builders');

var _Chat = require('../../Chat');

var _LoadingErrorIndicator = _interopRequireDefault(
  require('../LoadingErrorIndicator'),
);

afterEach(_react2.cleanup); // eslint-disable-line

describe('LoadingErrorIndicator', function () {
  it('should return null if no error is provided', function () {
    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _LoadingErrorIndicator.default,
          null,
        ),
      ),
      container = _render.container;

    expect(container).toBeEmptyDOMElement();
  });
  it('should render when an error is passed', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadingErrorIndicator.default,
          {
            error: {
              message: 'this is an error',
            },
          },
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div>\n        Error: {{ errorMessage }}\n      </div>\n    ',
    );
  });
  it(
    'should actually render the message with translation fn',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var chatClient, _render2, getByText;

        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)({
                  id: 'test',
                });

              case 2:
                chatClient = _context.sent;
                (_render2 = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _Chat.Chat,
                    {
                      client: chatClient,
                    },
                    /*#__PURE__*/ _react.default.createElement(
                      _LoadingErrorIndicator.default,
                      {
                        error: {
                          message: 'test error message',
                        },
                      },
                    ),
                    ',',
                  ),
                )),
                  (getByText = _render2.getByText);
                (0, _react2.waitFor)(function () {
                  expect(getByText('test error message')).toBeInTheDocument();
                });

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
});
