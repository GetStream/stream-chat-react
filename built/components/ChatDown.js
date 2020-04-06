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
var LoadingChannels_1 = require('./LoadingChannels');
var str_chat__connection_error_svg_1 = __importDefault(
  require('../assets/str-chat__connection-error.svg'),
);
var context_1 = require('../context');
/**
 * ChatDown - Indicator that chat is down or your network isn't working
 *
 * @example ./docs/ChatDown.md
 * @extends PureComponent
 */
var ChatDown = /** @class */ (function(_super) {
  __extends(ChatDown, _super);
  function ChatDown() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  ChatDown.prototype.render = function() {
    var _a = this.props,
      image = _a.image,
      type = _a.type,
      text = _a.text,
      t = _a.t;
    return react_1.default.createElement(
      'div',
      { className: 'str-chat__down' },
      react_1.default.createElement(LoadingChannels_1.LoadingChannels, null),
      react_1.default.createElement(
        'div',
        { className: 'str-chat__down-main' },
        react_1.default.createElement('img', { src: image }),
        react_1.default.createElement('h1', null, type),
        react_1.default.createElement(
          'h3',
          null,
          text || t('Error connecting to chat, refresh the page to try again.'),
        ),
      ),
    );
  };
  ChatDown.propTypes = {
    /** The image url for this error */
    image: prop_types_1.default.string,
    /** The type of error */
    type: prop_types_1.default.string,
    /** The error message to show */
    text: prop_types_1.default.string,
  };
  ChatDown.defaultProps = {
    image: str_chat__connection_error_svg_1.default,
    type: 'Error',
  };
  return ChatDown;
})(react_1.default.PureComponent);
exports.ChatDown = ChatDown;
exports.ChatDown = ChatDown = context_1.withTranslationContext(ChatDown);
