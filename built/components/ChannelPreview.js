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
var ChannelPreviewCountOnly_1 = require('./ChannelPreviewCountOnly');
var context_1 = require('../context');
var ChannelPreview = /** @class */ (function(_super) {
  __extends(ChannelPreview, _super);
  function ChannelPreview(props) {
    var _this = _super.call(this, props) || this;
    _this.handleEvent = function(event) {
      var channel = _this.props.channel;
      var isActive = _this.props.activeChannel.cid === channel.cid;
      if (!isActive) {
        var unread = channel.countUnread(_this.state.lastRead);
        _this.setState({ lastMessage: event.message, unread: unread });
      } else {
        _this.setState({ lastMessage: event.message, unread: 0 });
      }
    };
    _this.getLatestMessage = function() {
      var _a = _this.props,
        channel = _a.channel,
        t = _a.t;
      var latestMessage =
        channel.state.messages[channel.state.messages.length - 1];
      if (!latestMessage) {
        return t('Nothing yet...');
      }
      if (latestMessage.deleted_at) {
        return t('Message deleted');
      }
      if (latestMessage.text) {
        return latestMessage.text;
      } else {
        if (latestMessage.command) {
          return '/' + latestMessage.command;
        }
        if (latestMessage.attachments.length) {
          return t('🏙 Attachment...');
        }
        return t('Empty message...');
      }
    };
    _this.state = {
      lastMessage: {},
      unread: 0,
      lastRead: new Date(),
    };
    return _this;
  }
  ChannelPreview.prototype.componentDidMount = function() {
    // listen to change...
    var channel = this.props.channel;
    var unread = channel.countUnread();
    this.setState({ unread: unread });
    channel.on('message.new', this.handleEvent);
    channel.on('message.updated', this.handleEvent);
    channel.on('message.deleted', this.handleEvent);
  };
  ChannelPreview.prototype.componentWillUnmount = function() {
    var channel = this.props.channel;
    channel.off('message.new', this.handleEvent);
    channel.off('message.updated', this.handleEvent);
    channel.off('message.deleted', this.handleEvent);
  };
  ChannelPreview.prototype.componentDidUpdate = function(prevProps) {
    if (this.props.activeChannel.cid !== prevProps.activeChannel.cid) {
      var isActive = this.props.activeChannel.cid === this.props.channel.cid;
      if (isActive) {
        this.setState({ unread: 0, lastRead: new Date() });
      }
    }
  };
  ChannelPreview.prototype.render = function() {
    var props = __assign(__assign({}, this.state), this.props);
    var Preview = this.props.Preview;
    return react_1.default.createElement(
      Preview,
      __assign({}, props, {
        latestMessage: this.getLatestMessage(),
        active: this.props.activeChannel.cid === this.props.channel.cid,
      }),
    );
  };
  ChannelPreview.propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: prop_types_1.default.object.isRequired,
    /** Current selected channel object */
    activeChannel: prop_types_1.default.object.isRequired,
    /** Setter for selected channel */
    setActiveChannel: prop_types_1.default.func.isRequired,
    /**
     * Available built-in options (also accepts the same props as):
     *
     * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
     * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
     * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
     *
     * The Preview to use, defaults to ChannelPreviewLastMessage
     * */
    Preview: prop_types_1.default.oneOfType([
      prop_types_1.default.node,
      prop_types_1.default.func,
    ]),
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: prop_types_1.default.object,
  };
  ChannelPreview.defaultProps = {
    Preview: ChannelPreviewCountOnly_1.ChannelPreviewCountOnly,
  };
  return ChannelPreview;
})(react_1.PureComponent);
exports.ChannelPreview = ChannelPreview;
exports.ChannelPreview = ChannelPreview = context_1.withTranslationContext(
  ChannelPreview,
);
