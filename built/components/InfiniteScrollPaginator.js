'use strict';
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var react_file_utils_1 = require('react-file-utils');
var InfiniteScroll_1 = __importDefault(require('./InfiniteScroll'));
var InfiniteScrollPaginator = /** @class */ (function(_super) {
  __extends(InfiniteScrollPaginator, _super);
  function InfiniteScrollPaginator() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  InfiniteScrollPaginator.prototype.render = function() {
    var _a = this.props,
      LoadingIndicator = _a.LoadingIndicator,
      loadNextPage = _a.loadNextPage,
      hasNextPage = _a.hasNextPage,
      refreshing = _a.refreshing,
      reverse = _a.reverse,
      threshold = _a.threshold;
    return react_1.default.createElement(
      InfiniteScroll_1.default,
      {
        loadMore: loadNextPage,
        hasMore: hasNextPage,
        isLoading: refreshing,
        isReverse: reverse,
        threshold: threshold,
        useWindow: false,
        loader: react_1.default.createElement(
          'div',
          {
            className: 'str-chat__infinite-scroll-paginator',
            key: 'loadingindicator',
          },
          react_1.default.createElement(LoadingIndicator, null),
        ),
      },
      this.props.children,
    );
  };
  InfiniteScrollPaginator.propTypes = {
    /** callback to load the next page */
    loadNextPage: prop_types_1.default.func,
    /** indicates if there is a next page to load */
    hasNextPage: prop_types_1.default.bool,
    /** indicates if there there's currently any refreshing taking place */
    refreshing: prop_types_1.default.bool,
    /** display the items in opposite order */
    reverse: prop_types_1.default.bool,
    /** Offset from when to start the loadNextPage call */
    threshold: prop_types_1.default.number,
    /** The loading indicator to use */
    LoadingIndicator: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
  };
  InfiniteScrollPaginator.defaultProps = {
    LoadingIndicator: react_file_utils_1.LoadingIndicator,
  };
  return InfiniteScrollPaginator;
})(react_1.default.Component);
exports.InfiniteScrollPaginator = InfiniteScrollPaginator;
