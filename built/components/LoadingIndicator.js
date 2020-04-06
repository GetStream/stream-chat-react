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
/**
 * LoadingIndicator - Just a simple loading spinner..
 *
 * @example ./docs/LoadingIndicator.md
 * @extends PureComponent
 */
var LoadingIndicator = /** @class */ (function(_super) {
  __extends(LoadingIndicator, _super);
  function LoadingIndicator() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.stopRef = react_1.default.createRef();
    return _this;
  }
  LoadingIndicator.prototype.render = function() {
    var _a = this.props,
      size = _a.size,
      color = _a.color;
    return react_1.default.createElement(
      'div',
      {
        className: 'str-chat__loading-indicator ' + color,
        style: { width: size, height: size },
      },
      react_1.default.createElement(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 30 30',
          xmlns: 'http://www.w3.org/2000/svg',
        },
        react_1.default.createElement(
          'defs',
          null,
          react_1.default.createElement(
            'linearGradient',
            { x1: '50%', y1: '0%', x2: '50%', y2: '100%', id: 'a' },
            react_1.default.createElement('stop', {
              stopColor: '#FFF',
              stopOpacity: '0',
              offset: '0%',
            }),
            react_1.default.createElement('stop', {
              ref: this.stopRef,
              offset: '100%',
              stopColor: color,
              stopOpacity: '1',
              style: { stopColor: color },
            }),
          ),
        ),
        react_1.default.createElement('path', {
          d:
            'M2.518 23.321l1.664-1.11A12.988 12.988 0 0 0 15 28c7.18 0 13-5.82 13-13S22.18 2 15 2V0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-5.206 0-9.792-2.652-12.482-6.679z',
          fill: 'url(#a)',
          fillRule: 'evenodd',
        }),
      ),
    );
  };
  LoadingIndicator.propTypes = {
    /** The size of the loading icon */
    size: prop_types_1.default.number,
    /** Set the color of the LoadingIndicator */
    color: prop_types_1.default.string,
  };
  LoadingIndicator.defaultProps = {
    size: 15,
    color: '#006CFF',
  };
  return LoadingIndicator;
})(react_1.default.PureComponent);
exports.LoadingIndicator = LoadingIndicator;
