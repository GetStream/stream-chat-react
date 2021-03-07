'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _extends2 = _interopRequireDefault(
  require('@babel/runtime/helpers/extends'),
);

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _ChannelPreviewCountOnly = _interopRequireDefault(
  require('./ChannelPreviewCountOnly'),
);

var _context = require('../../context');

var _utils = require('./utils');

// @ts-check
// eslint-disable-next-line import/no-unresolved

/**
 * @type {React.FC<import('types').ChannelPreviewProps>}
 */
var ChannelPreview = function ChannelPreview(props) {
  var channel = props.channel,
    _props$Preview = props.Preview,
    Preview =
      _props$Preview === void 0
        ? _ChannelPreviewCountOnly.default
        : _props$Preview;

  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client,
    activeChannel = _useContext.channel,
    setActiveChannel = _useContext.setActiveChannel;

  var _useContext2 = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext2.t;

  var _useState = (0, _react.useState)(
      /** @type {import('stream-chat').MessageResponse | undefined} */
      undefined,
    ),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    lastMessage = _useState2[0],
    setLastMessage = _useState2[1];

  var _useState3 = (0, _react.useState)(0),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    unread = _useState4[0],
    setUnread = _useState4[1];

  var isActive =
    (activeChannel === null || activeChannel === void 0
      ? void 0
      : activeChannel.cid) === channel.cid;

  var _channel$muteStatus = channel.muteStatus(),
    muted = _channel$muteStatus.muted;

  (0, _react.useEffect)(
    function () {
      if (isActive || muted) {
        setUnread(0);
      } else {
        setUnread(channel.countUnread());
      }
    },
    [channel, isActive, muted],
  );
  (0, _react.useEffect)(
    function () {
      /** @type {(event: import('stream-chat').Event) => void} */
      var handleEvent = function handleEvent(event) {
        setLastMessage(event.message);

        if (!isActive && !muted) {
          setUnread(channel.countUnread());
        } else {
          setUnread(0);
        }
      };

      channel.on('message.new', handleEvent);
      channel.on('message.updated', handleEvent);
      channel.on('message.deleted', handleEvent);
      return function () {
        channel.off('message.new', handleEvent);
        channel.off('message.updated', handleEvent);
        channel.off('message.deleted', handleEvent);
      };
    },
    [channel, isActive, muted],
  );
  if (!Preview) return null;
  return /*#__PURE__*/ _react.default.createElement(
    Preview,
    (0, _extends2.default)({}, props, {
      setActiveChannel: setActiveChannel,
      lastMessage: lastMessage,
      unread: unread,
      latestMessage: (0, _utils.getLatestMessagePreview)(channel, t),
      displayTitle: (0, _utils.getDisplayTitle)(channel, client.user),
      displayImage: (0, _utils.getDisplayImage)(channel, client.user),
      active: isActive,
    }),
  );
};

ChannelPreview.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel:
    /** @type {PropTypes.Validator<import('stream-chat').Channel>} */
    _propTypes.default.object.isRequired,

  /** Current selected channel object */
  activeChannel:
    /** @type {PropTypes.Validator<import('stream-chat').Channel | null | undefined>} */
    _propTypes.default.object,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview:
    /** @type {PropTypes.Validator<React.ComponentType<import('types').ChannelPreviewUIComponentProps>>} */
    _propTypes.default.elementType,
};
var _default = ChannelPreview;
exports.default = _default;
