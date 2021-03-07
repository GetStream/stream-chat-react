'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _react = _interopRequireDefault(require('react'));

var _react2 = require('@testing-library/react');

var _reactTestRenderer = _interopRequireDefault(require('react-test-renderer'));

require('@testing-library/jest-dom');

var _LoadMoreButton = _interopRequireDefault(require('../LoadMoreButton'));

describe('LoadMoreButton', function () {
  afterEach(_react2.cleanup);
  it('should render component with default props', function () {
    var tree = _reactTestRenderer.default
      .create(
        /*#__PURE__*/ _react.default.createElement(_LoadMoreButton.default, {
          refreshing: false,
          onClick: function onClick() {
            return null;
          },
        }),
      )
      .toJSON();

    expect(tree).toMatchInlineSnapshot(
      '\n      <div\n        className="str-chat__load-more-button"\n      >\n        <button\n          className="str-chat__load-more-button__button"\n          data-testid="load-more-button"\n          disabled={false}\n          onClick={[Function]}\n        >\n          Load more\n        </button>\n      </div>\n    ',
    );
  });
  it('should trigger onClick function when clicked', function () {
    var onClickMock = jest.fn();

    var _render = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_LoadMoreButton.default, {
          refreshing: false,
          onClick: onClickMock,
        }),
      ),
      getByTestId = _render.getByTestId;

    _react2.fireEvent.click(getByTestId('load-more-button'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
  it('should be disabled and show loading indicator when refreshing is true', function () {
    var onClickMock = jest.fn();

    var _render2 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(_LoadMoreButton.default, {
          refreshing: true,
          onClick: onClickMock,
        }),
      ),
      getByTestId = _render2.getByTestId;

    _react2.fireEvent.click(getByTestId('load-more-button'));

    expect(onClickMock).not.toHaveBeenCalledTimes(1);
    var loadingIndicator = getByTestId('load-more-button').querySelector(
      '.rfu-loading-indicator__spinner',
    );
    expect(loadingIndicator).toBeInTheDocument();
  });
  it('should display children', function () {
    var _render3 = (0, _react2.render)(
        /*#__PURE__*/ _react.default.createElement(
          _LoadMoreButton.default,
          {
            refreshing: true,
            onClick: function onClick() {
              return null;
            },
          },
          'Test Button',
        ),
      ),
      getByText = _render3.getByText;

    (0, _react2.waitFor)(function () {
      expect(getByText('Test Button')).toBeInTheDocument();
    });
  });
});
