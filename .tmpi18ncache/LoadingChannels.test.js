'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _LoadingChannels = _interopRequireDefault(require('../LoadingChannels'));

afterEach(_react2.cleanup); // eslint-disable-line

describe('LoadingChannels', function () {
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(
          _LoadingChannels.default,
          null,
        ),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
});
