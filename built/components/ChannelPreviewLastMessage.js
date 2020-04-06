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
var Avatar_1 = require('./Avatar');
var prop_types_1 = __importDefault(require('prop-types'));
var truncate_1 = __importDefault(require('lodash/truncate'));
var context_1 = require('../context');
/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ./docs/ChannelPreviewLastMessage.md
 * @extends PureComponent
 */
var ChannelPreviewLastMessage = /** @class */ (function(_super) {
  __extends(ChannelPreviewLastMessage, _super);
  function ChannelPreviewLastMessage() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.channelPreviewButton = react_1.default.createRef();
    _this.onSelectChannel = function() {
      _this.props.setActiveChannel(_this.props.channel, _this.props.watchers);
      _this.channelPreviewButton.current.blur();
    };
    return _this;
  }
  ChannelPreviewLastMessage.prototype.render = function() {
    var t = this.props.t;
    var unreadClass =
      this.props.unread >= 1 ? 'str-chat__channel-preview--unread' : '';
    var activeClass = this.props.active
      ? 'str-chat__channel-preview--active'
      : '';
    var name = this.props.channel.data.name || this.props.channel.cid;
    return react_1.default.createElement(
      'div',
      {
        className:
          'str-chat__channel-preview ' + unreadClass + ' ' + activeClass,
      },
      react_1.default.createElement(
        'button',
        { onClick: this.onSelectChannel, ref: this.channelPreviewButton },
        this.props.unread >= 1 &&
          react_1.default.createElement('div', {
            className: 'str-chat__channel-preview--dot',
          }),
        react_1.default.createElement(Avatar_1.Avatar, {
          image: this.props.channel.data.image,
        }),
        react_1.default.createElement(
          'div',
          { className: 'str-chat__channel-preview-info' },
          react_1.default.createElement(
            'span',
            { className: 'str-chat__channel-preview-title' },
            name,
          ),
          react_1.default.createElement(
            'span',
            { className: 'str-chat__channel-preview-last-message' },
            !this.props.channel.state.messages[0]
              ? t('Nothing yet...')
              : truncate_1.default(this.props.latestMessage, {
                  length: this.props.latestMessageLength,
                }),
          ),
          this.props.unread >= 1 &&
            react_1.default.createElement(
              'span',
              { className: 'str-chat__channel-preview-unread-count' },
              this.props.unread,
            ),
        ),
      ),
    );
  };
  ChannelPreviewLastMessage.propTypes = {
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
    /** Length of latest message to truncate at */
    latestMessageLength: prop_types_1.default.number,
  };
  ChannelPreviewLastMessage.defaultProps = {
    latestMessageLength: 20,
  };
  return ChannelPreviewLastMessage;
})(react_1.PureComponent);
exports.ChannelPreviewLastMessage = ChannelPreviewLastMessage;
exports.ChannelPreviewLastMessage = ChannelPreviewLastMessage = context_1.withTranslationContext(
  ChannelPreviewLastMessage,
);
