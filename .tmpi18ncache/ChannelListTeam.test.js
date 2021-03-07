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

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _mockBuilders = require('mock-builders');

var _ = require('..');

var _context3 = require('../../../context');

// Weird hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = function () {
  return null;
};

var Component = function Component(_ref) {
  var Avatar = _ref.Avatar,
    client = _ref.client,
    _ref$loading = _ref.loading,
    loading = _ref$loading === void 0 ? false : _ref$loading,
    _ref$error = _ref.error,
    error = _ref$error === void 0 ? false : _ref$error;
  return /*#__PURE__*/ _react.default.createElement(
    _context3.ChatContext.Provider,
    {
      value: {
        client,
      },
    },
    /*#__PURE__*/ _react.default.createElement(
      _.ChannelListTeam,
      {
        client: client,
        loading: loading,
        error: error,
        Avatar: Avatar,
        LoadingIndicator: function LoadingIndicator() {
          return /*#__PURE__*/ _react.default.createElement(
            'div',
            null,
            'Loading Indicator',
          );
        },
        LoadingErrorIndicator: function LoadingErrorIndicator() {
          return /*#__PURE__*/ _react.default.createElement(
            'div',
            null,
            'Loading Error Indicator',
          );
        },
      },
      /*#__PURE__*/ _react.default.createElement('div', null, 'children 1'),
      /*#__PURE__*/ _react.default.createElement('div', null, 'children 2'),
    ),
  );
};

describe('ChannelListTeam', function () {
  afterEach(_react2.cleanup);
  var chatClientVishal;
  beforeEach(
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return (0, _mockBuilders.getTestClientWithUser)({
                  id: 'vishal',
                });

              case 2:
                chatClientVishal = _context.sent;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee);
      }),
    ),
  );
  it('by default, should render sidebar, userbar and children', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(Component, {
          client: chatClientVishal,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(Component, {
          client: chatClientVishal,
          error: true,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('when `loading` prop is true, `LoadingIndicator` should be rendered', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(Component, {
          client: chatClientVishal,
          loading: true,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it(
    'when `Avatar` prop is provided, custom avatar component should render',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var _render, getByTestId;

        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                (_render = (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(Component, {
                    client: chatClientVishal,
                    Avatar: function Avatar() {
                      return /*#__PURE__*/ _react.default.createElement(
                        'div',
                        {
                          'data-testid': 'custom-avatar',
                        },
                        'Avatar',
                      );
                    },
                  }),
                )),
                  (getByTestId = _render.getByTestId);
                _context2.next = 3;
                return (0, _react2.waitFor)(function () {
                  expect(getByTestId('custom-avatar')).toBeInTheDocument();
                });

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
});
