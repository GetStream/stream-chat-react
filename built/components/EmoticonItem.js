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
var react_1 = __importStar(require('react'));
var prop_types_1 = __importDefault(require('prop-types'));
var EmoticonItem = /** @class */ (function(_super) {
  __extends(EmoticonItem, _super);
  function EmoticonItem() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  EmoticonItem.prototype.render = function() {
    return react_1.default.createElement(
      'div',
      { className: 'str-chat__emoji-item' },
      react_1.default.createElement(
        'span',
        { className: 'str-chat__emoji-item--entity' },
        this.props.entity.native,
      ),
      react_1.default.createElement(
        'span',
        { className: 'str-chat__emoji-item--name' },
        this.props.entity.name,
      ),
      react_1.default.createElement(
        'span',
        { className: 'str-chat__emoji-item--char' },
        this.props.entity.char,
      ),
    );
  };
  EmoticonItem.propTypes = {
    entity: prop_types_1.default.shape({
      /** Name for emoticon */
      name: prop_types_1.default.string,
      /** Native value or actual emoticon */
      native: prop_types_1.default.string,
      /** Representative character for emoticon */
      char: prop_types_1.default.string,
    }),
  };
  return EmoticonItem;
})(react_1.PureComponent);
exports.EmoticonItem = EmoticonItem;
