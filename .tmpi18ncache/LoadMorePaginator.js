'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _LoadMoreButton = _interopRequireDefault(require('./LoadMoreButton'));

var _utils = require('../../utils');

var LoadMorePaginator = function LoadMorePaginator(_ref) {
  var reverse = _ref.reverse,
    hasNextPage = _ref.hasNextPage,
    refreshing = _ref.refreshing,
    loadNextPage = _ref.loadNextPage,
    LoadMoreButton = _ref.LoadMoreButton,
    children = _ref.children;
  return /*#__PURE__*/ _react.default.createElement(
    _react.default.Fragment,
    null,
    !reverse && children,
    hasNextPage &&
      (0, _utils.smartRender)(LoadMoreButton, {
        refreshing,
        onClick: loadNextPage,
      }),
    reverse && children,
  );
};

LoadMorePaginator.defaultProps = {
  LoadMoreButton: _LoadMoreButton.default,
};
LoadMorePaginator.propTypes = {
  LoadMoreButton: _propTypes.default.oneOfType([
    _propTypes.default.node,
    _propTypes.default.func,
    _propTypes.default.object,
  ]),

  /** callback to load the next page */
  loadNextPage: _propTypes.default.func,

  /** indicates if there is a next page to load */
  hasNextPage: _propTypes.default.bool,

  /** display the items in opposite order */
  reverse: _propTypes.default.bool,
};

var _default = /*#__PURE__*/ _react.default.memo(LoadMorePaginator);

exports.default = _default;
