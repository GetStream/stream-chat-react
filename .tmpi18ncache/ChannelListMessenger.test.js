'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

require('@testing-library/jest-dom');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

var _ = require('..');

// Weird hack to avoid big warnings
// Maybe better to find a better solution for it.
console.warn = function () {
  return null;
};

var Component = function Component(_ref) {
  var _ref$loading = _ref.loading,
    loading = _ref$loading === void 0 ? false : _ref$loading,
    _ref$error = _ref.error,
    error = _ref$error === void 0 ? false : _ref$error;
  return /*#__PURE__*/ _react.default.createElement(
    _.ChannelListMessenger,
    {
      loading: loading,
      error: error,
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
  );
};

describe('ChannelListMessenger', function () {
  afterEach(_react2.cleanup);
  it('by default, children should be rendered', function () {
    var tree = _reactTestRenderer.default
      .create(/*#__PURE__*/ _react.default.createElement(Component, null))
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
  it('when `error` prop is true, `LoadingErrorIndicator` should be rendered', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(Component, {
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
          loading: true,
        }),
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
});
