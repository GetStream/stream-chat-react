'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _reactFileUtils = require('react-file-utils');

var _InfiniteScroll = _interopRequireDefault(require('./InfiniteScroll'));

// @ts-check
// @ts-expect-error

/**
 * @type { React.FC<import('types').InfiniteScrollPaginatorProps>}
 */
var InfiniteScrollPaginator = function InfiniteScrollPaginator(_ref) {
  var _ref$LoadingIndicator = _ref.LoadingIndicator,
    LoadingIndicator =
      _ref$LoadingIndicator === void 0
        ? _reactFileUtils.LoadingIndicator
        : _ref$LoadingIndicator,
    loadNextPage = _ref.loadNextPage,
    hasNextPage = _ref.hasNextPage,
    refreshing = _ref.refreshing,
    reverse = _ref.reverse,
    threshold = _ref.threshold,
    children = _ref.children;
  return /*#__PURE__*/ _react.default.createElement(
    _InfiniteScroll.default,
    {
      loadMore: loadNextPage,
      hasMore: hasNextPage,
      isLoading: refreshing,
      isReverse: reverse,
      threshold: threshold,
      useWindow: false,
      loader: /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__infinite-scroll-paginator',
          key: 'loadingindicator',
        },
        /*#__PURE__*/ _react.default.createElement(LoadingIndicator, null),
      ),
    },
    children,
  );
};

InfiniteScrollPaginator.propTypes = {
  /** callback to load the next page */
  loadNextPage: _propTypes.default.func.isRequired,

  /** indicates if there is a next page to load */
  hasNextPage: _propTypes.default.bool,

  /** indicates if there there's currently any refreshing taking place */
  refreshing: _propTypes.default.bool,

  /** display the items in opposite order */
  reverse: _propTypes.default.bool,

  /** Offset from when to start the loadNextPage call */
  threshold: _propTypes.default.number,

  /** The loading indicator to use */
  // @ts-expect-error
  LoadingIndicator: _propTypes.default.elementType,
};
var _default = InfiniteScrollPaginator;
exports.default = _default;
