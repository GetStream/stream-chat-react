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
var MessageNotification = /** @class */ (function(_super) {
  __extends(MessageNotification, _super);
  function MessageNotification() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  MessageNotification.prototype.render = function() {
    if (!this.props.showNotification) {
      return null;
    } else {
      return react_1.default.createElement(
        'button',
        {
          className: 'str-chat__message-notification',
          onClick: this.props.onClick,
        },
        this.props.children,
      );
    }
  };
  MessageNotification.propTypes = {
    /** If we should show the notification or not */
    showNotification: prop_types_1.default.bool,
    /** Onclick handler */
    onClick: prop_types_1.default.func.isRequired,
  };
  MessageNotification.defaultProps = {
    showNotification: true,
  };
  return MessageNotification;
})(react_1.PureComponent);
exports.MessageNotification = MessageNotification;
