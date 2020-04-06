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
var ChannelPreviewCountOnly = /** @class */ (function(_super) {
  __extends(ChannelPreviewCountOnly, _super);
  function ChannelPreviewCountOnly() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  ChannelPreviewCountOnly.prototype.render = function() {
    var unreadClass = this.props.unread >= 1 ? 'unread' : '';
    var name = this.props.channel.data.name || this.props.channel.cid;
    return react_1.default.createElement(
      'div',
      { className: unreadClass },
      react_1.default.createElement(
        'button',
        { onClick: this.props.setActiveChannel.bind(this, this.props.channel) },
        ' ',
        name,
        ' ',
        react_1.default.createElement('span', null, this.props.unread),
      ),
    );
  };
  ChannelPreviewCountOnly.propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: prop_types_1.default.object.isRequired,
    /** Current selected channel object */
    activeChannel: prop_types_1.default.object.isRequired,
    /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
    setActiveChannel: prop_types_1.default.func.isRequired,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: prop_types_1.default.object,
    /** Number of unread messages */
    unread: prop_types_1.default.number,
  };
  return ChannelPreviewCountOnly;
})(react_1.PureComponent);
exports.ChannelPreviewCountOnly = ChannelPreviewCountOnly;
