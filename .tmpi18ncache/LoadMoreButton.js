'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _reactFileUtils = require('react-file-utils');

// @ts-check
// @ts-expect-error

/**
 * @type {React.FC<import('types').LoadMoreButtonProps>}
 */
var LoadMoreButton = function LoadMoreButton(_ref) {
  var onClick = _ref.onClick,
    refreshing = _ref.refreshing,
    _ref$children = _ref.children,
    children = _ref$children === void 0 ? 'Load more' : _ref$children;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__load-more-button',
    },
    /*#__PURE__*/ _react.default.createElement(
      'button',
      {
        className: 'str-chat__load-more-button__button',
        onClick: onClick,
        'data-testid': 'load-more-button',
        disabled: refreshing,
      },
      refreshing
        ? /*#__PURE__*/ _react.default.createElement(
            _reactFileUtils.LoadingIndicator,
            null,
          )
        : children,
    ),
  );
};

LoadMoreButton.propTypes = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: _propTypes.default.func.isRequired,

  /** If true, LoadingIndicator is displayed instead of button */
  refreshing: _propTypes.default.bool.isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(LoadMoreButton);

exports.default = _default;
