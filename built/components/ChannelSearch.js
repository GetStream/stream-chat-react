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
// import PropTypes from 'prop-types';
var ChannelSearch = /** @class */ (function(_super) {
  __extends(ChannelSearch, _super);
  function ChannelSearch() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  ChannelSearch.prototype.render = function() {
    return react_1.default.createElement(
      'div',
      { className: 'str-chat__channel-search' },
      react_1.default.createElement('input', {
        type: 'text',
        placeholder: 'Search',
      }),
      react_1.default.createElement(
        'button',
        { type: 'submit' },
        react_1.default.createElement(
          'svg',
          {
            width: '18',
            height: '17',
            viewBox: '0 0 18 17',
            xmlns: 'http://www.w3.org/2000/svg',
          },
          react_1.default.createElement('path', {
            d: 'M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z',
            fillRule: 'evenodd',
          }),
        ),
      ),
    );
  };
  return ChannelSearch;
})(react_1.default.PureComponent);
exports.ChannelSearch = ChannelSearch;
