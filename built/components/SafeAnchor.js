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
var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var sanitize_url_1 = require('@braintree/sanitize-url');
/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @extends PureComponent
 */
var SafeAnchor = /** @class */ (function(_super) {
  __extends(SafeAnchor, _super);
  function SafeAnchor() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  SafeAnchor.prototype.render = function() {
    var href = sanitize_url_1.sanitizeUrl(this.props.href);
    return react_1.default.createElement(
      'a',
      __assign({}, this.props, { href: href }),
      this.props.children,
    );
  };
  return SafeAnchor;
})(react_1.default.PureComponent);
exports.SafeAnchor = SafeAnchor;
