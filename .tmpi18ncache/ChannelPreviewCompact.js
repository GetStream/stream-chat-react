'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _streamChat = require('stream-chat');

var _Avatar = require('../Avatar');

// @ts-check
// eslint-disable-next-line import/no-unresolved

/**
 *
 * @example ../../docs/ChannelPreviewCompact.md
 * @type {import('types').ChannelPreviewCompact}
 */
var ChannelPreviewCompact = function ChannelPreviewCompact(props) {
  var _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar;
  /**
   * @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax
   */

  var channelPreviewButton = (0, _react.useRef)(null);
  var unreadClass =
    props.unread_count >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
  var activeClass = props.active
    ? 'str-chat__channel-preview-compact--active'
    : '';

  var onSelectChannel = function onSelectChannel() {
    props.setActiveChannel(props.channel, props.watchers);

    if (
      channelPreviewButton !== null &&
      channelPreviewButton !== void 0 &&
      channelPreviewButton.current
    ) {
      channelPreviewButton.current.blur();
    }
  };

  return /*#__PURE__*/ _react.default.createElement(
    'button',
    {
      'data-testid': 'channel-preview-button',
      onClick: onSelectChannel,
      ref: channelPreviewButton,
      className: 'str-chat__channel-preview-compact '
        .concat(unreadClass, ' ')
        .concat(activeClass),
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__channel-preview-compact--left',
      },
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        image: props.displayImage,
        name: props.displayTitle,
        size: 20,
      }),
    ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__channel-preview-compact--right',
      },
      props.displayTitle,
    ),
  );
};

ChannelPreviewCompact.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: _propTypes.default.instanceOf(_streamChat.Channel).isRequired,

  /** Current selected channel object */
  activeChannel: _propTypes.default.instanceOf(_streamChat.Channel),

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /** Setter for selected channel */
  setActiveChannel: _propTypes.default.func.isRequired,

  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers:
    /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */
    _propTypes.default.object,

  /** Number of unread messages */
  unread: _propTypes.default.number,

  /** If channel of component is active (selected) channel */
  active: _propTypes.default.bool,

  /** Latest message's text. */
  latestMessage: _propTypes.default.string,

  /** Title of channel to display */
  displayTitle: _propTypes.default.string,

  /** Image of channel to display */
  displayImage: _propTypes.default.string,
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelPreviewCompact);

exports.default = _default;
