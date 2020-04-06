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
var Avatar_1 = require('./Avatar');
var prop_types_1 = __importDefault(require('prop-types'));
/**
 *
 * @example ./docs/ChannelPreviewCompact.md
 * @extends PureComponent
 *
 */
var ChannelPreviewCompact = /** @class */ (function(_super) {
  __extends(ChannelPreviewCompact, _super);
  function ChannelPreviewCompact() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.channelPreviewButton = react_1.default.createRef();
    _this.onSelectChannel = function() {
      _this.props.setActiveChannel(_this.props.channel, _this.props.watchers);
      _this.channelPreviewButton.current.blur();
    };
    return _this;
  }
  ChannelPreviewCompact.prototype.render = function() {
    var unreadClass =
      this.props.unread_count >= 1
        ? 'str-chat__channel-preview-compact--unread'
        : '';
    var activeClass = this.props.active
      ? 'str-chat__channel-preview-compact--active'
      : '';
    var name = this.props.channel.data.name || this.props.channel.cid;
    return react_1.default.createElement(
      'button',
      {
        onClick: this.onSelectChannel,
        ref: this.channelPreviewButton,
        className:
          'str-chat__channel-preview-compact ' +
          unreadClass +
          ' ' +
          activeClass,
      },
      react_1.default.createElement(
        'div',
        { className: 'str-chat__channel-preview-compact--left' },
        react_1.default.createElement(Avatar_1.Avatar, {
          image: this.props.channel.data.image,
          size: 20,
        }),
      ),
      react_1.default.createElement(
        'div',
        { className: 'str-chat__channel-preview-compact--right' },
        name,
      ),
    );
  };
  ChannelPreviewCompact.propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: prop_types_1.default.object.isRequired,
    /** Current selected channel object */
    activeChannel: prop_types_1.default.object.isRequired,
    /** Setter for selected channel */
    setActiveChannel: prop_types_1.default.func.isRequired,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: prop_types_1.default.object,
    /** Number of unread messages */
    unread: prop_types_1.default.number,
    /** If channel of component is active (selected) channel */
    active: prop_types_1.default.bool,
    /** Latest message's text. */
    latestMessage: prop_types_1.default.string,
  };
  return ChannelPreviewCompact;
})(react_1.default.PureComponent);
exports.ChannelPreviewCompact = ChannelPreviewCompact;
