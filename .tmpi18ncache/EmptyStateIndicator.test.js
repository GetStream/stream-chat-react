'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _EmptyStateIndicator = _interopRequireDefault(
  require('../EmptyStateIndicator'),
);

afterEach(_react2.cleanup); // eslint-disable-line

describe('EmptyStateIndicator', function () {
  it('should render with default props', function () {
    jest.spyOn(console, 'error').mockImplementationOnce(function () {
      return null;
    });

    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _EmptyStateIndicator.default,
          null,
        ),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <p>\n        No items exist\n      </p>\n    ',
    );
  });
  it('should return null if listType is message', function () {
    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _EmptyStateIndicator.default,
          {
            listType: 'message',
          },
        ),
      ),
      container = _render.container;

    expect(container).toBeEmptyDOMElement();
  });
  it('should display correct text when listType is channel', function () {
    var _render2 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _EmptyStateIndicator.default,
          {
            listType: 'channel',
          },
        ),
      ),
      getByText = _render2.getByText;

    expect(getByText('You have no channels currently')).toBeInTheDocument();
  });
  it('should display correct text when no listType is provided', function () {
    jest.spyOn(console, 'error').mockImplementationOnce(function () {
      return null;
    });

    var _render3 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _EmptyStateIndicator.default,
          null,
        ),
      ),
      getByText = _render3.getByText;

    expect(getByText('No items exist')).toBeInTheDocument();
  });
});
