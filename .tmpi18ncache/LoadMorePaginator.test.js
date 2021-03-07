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

var _LoadMorePaginator = _interopRequireDefault(
  require('../LoadMorePaginator'),
);

jest.mock('../LoadMoreButton', function () {
  return {
    __esModule: true,
    default: jest.fn(function () {
      return /*#__PURE__*/ _react.default.createElement('div', {
        'data-testid': 'load-more-button',
      });
    }),
  };
});
describe('LoadMorePaginator', function () {
  afterEach(_react2.cleanup);
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMorePaginator.default,
          null,
          'children',
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot('"children"');
  });
  it('should render default LoadMoreButton when hasNextPage', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMorePaginator.default,
          {
            hasNextPage: true,
          },
          'children',
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      Array [\n        "children",\n        <div\n          data-testid="load-more-button"\n        />,\n      ]\n    ',
    );
  });
  it('should render LoadMoreButton prop when hasNextPage 1', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMorePaginator.default,
          {
            hasNextPage: true,
            LoadMoreButton: /*#__PURE__*/ _react.default.createElement(
              'div',
              null,
              'custom load more button',
            ),
          },
          'children',
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      Array [\n        "children",\n        <div>\n          custom load more button\n        </div>,\n      ]\n    ',
    );
  });
  it('should render LoadMoreButton prop when hasNextPage 2', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMorePaginator.default,
          {
            hasNextPage: true,
            LoadMoreButton: function LoadMoreButton() {
              return /*#__PURE__*/ _react.default.createElement(
                'div',
                null,
                'load more button',
              );
            },
          },
          'children',
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      Array [\n        "children",\n        <div>\n          load more button\n        </div>,\n      ]\n    ',
    );
  });
  it('should render children after loader in reverse mode', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMorePaginator.default,
          {
            hasNextPage: true,
            reverse: true,
            LoadMoreButton: function LoadMoreButton() {
              return /*#__PURE__*/ _react.default.createElement(
                'div',
                null,
                'load more button',
              );
            },
          },
          'children',
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      Array [\n        <div>\n          load more button\n        </div>,\n        "children",\n      ]\n    ',
    );
  });
  it(
    'should pass undefined props to LoadMoreButton if missing',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee() {
        var LoadMoreButton;
        return _regenerator.default.wrap(function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                LoadMoreButton = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                  );
                });
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _LoadMorePaginator.default,
                    {
                      hasNextPage: true,
                      LoadMoreButton: LoadMoreButton,
                    },
                    'children',
                  ),
                );
                _context.next = 4;
                return (0, _react2.waitFor)(function () {
                  expect(LoadMoreButton).toHaveBeenCalledWith(
                    {
                      onClick: undefined,
                      refreshing: undefined,
                    },
                    {},
                  );
                });

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
    'should pass proper props to LoadMoreButton',
    /*#__PURE__*/ (0, _asyncToGenerator2.default)(
      /*#__PURE__*/ _regenerator.default.mark(function _callee2() {
        var LoadMoreButton, loadNextPage;
        return _regenerator.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                LoadMoreButton = jest.fn(function () {
                  return /*#__PURE__*/ _react.default.createElement(
                    'div',
                    null,
                  );
                });
                loadNextPage = jest.fn();
                (0, _react2.render)(
                  /*#__PURE__*/ _react.default.createElement(
                    _LoadMorePaginator.default,
                    {
                      hasNextPage: true,
                      LoadMoreButton: LoadMoreButton,
                      loadNextPage: loadNextPage,
                      refreshing: false,
                    },
                  ),
                );
                _context2.next = 5;
                return (0, _react2.waitFor)(function () {
                  expect(LoadMoreButton).toHaveBeenCalledWith(
                    {
                      onClick: loadNextPage,
                      refreshing: false,
                    },
                    {},
                  );
                });

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2);
      }),
    ),
  );
});
