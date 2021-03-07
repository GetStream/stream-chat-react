'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _LoadingIndicator = _interopRequireDefault(require('../LoadingIndicator'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('LoadingIndicator', function () {
  it('should render with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadingIndicator.default,
          null,
        ),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('should update style based on props', function () {
    var size = 30;
    var color = '#000000';

    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_LoadingIndicator.default, {
          size: size,
          color: color,
        }),
      ),
      getByTestId = _render.getByTestId;

    var wrapper = getByTestId('loading-indicator-wrapper');
    var circle = getByTestId('loading-indicator-circle');
    (0, _react2.waitFor)(function () {
      expect(wrapper).toHaveStyle({
        width: size,
        height: size,
      });
      expect(wrapper.firstChild).toHaveAttribute('width', size);
      expect(wrapper.firstChild).toHaveAttribute('height', size);
      expect(circle).toHaveAttribute('stop-color', color);
      expect(circle).toHaveStyle({
        stopColor: color,
      });
    });
  });
});
