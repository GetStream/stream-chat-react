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
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var React = __importStar(require('react'));
var LoadMoreButton_1 = require('./LoadMoreButton');
var prop_types_1 = __importDefault(require('prop-types'));
var utils_1 = require('../utils');
var LoadMorePaginator = /** @class */ (function(_super) {
  __extends(LoadMorePaginator, _super);
  function LoadMorePaginator() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  LoadMorePaginator.prototype.render = function() {
    return React.createElement(
      React.Fragment,
      null,
      !this.props.reverse && this.props.children,
      this.props.hasNextPage
        ? utils_1.smartRender(this.props.LoadMoreButton, {
            refreshing: this.props.refreshing,
            onClick: this.props.loadNextPage,
          })
        : null,
      this.props.reverse && this.props.children,
    );
  };
  LoadMorePaginator.propTypes = {
    LoadMoreButton: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /** callback to load the next page */
    loadNextPage: prop_types_1.default.func,
    /** indicates if there is a next page to load */
    hasNextPage: prop_types_1.default.bool,
    /** display the items in opposite order */
    reverse: prop_types_1.default.bool,
  };
  LoadMorePaginator.defaultProps = {
    LoadMoreButton: LoadMoreButton_1.LoadMoreButton,
  };
  return LoadMorePaginator;
})(React.PureComponent);
exports.LoadMorePaginator = LoadMorePaginator;
