'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _utils = require('../../utils');

var _Avatar = require('../Avatar');

// @ts-check
// eslint-disable-next-line import/no-unresolved

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ../../docs/ChannelPreviewLastMessage.md
 * @type {import('types').ChannelPreviewLastMessage}
 */
var ChannelPreviewLastMessage = function ChannelPreviewLastMessage(props) {
  var _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar;
  /** @type {React.MutableRefObject<HTMLButtonElement | null>} Typescript syntax */

  var channelPreviewButton = (0, _react.useRef)(null);

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

  var unreadClass =
    props.unread >= 1 ? 'str-chat__channel-preview--unread' : '';
  var activeClass = props.active ? 'str-chat__channel-preview--active' : '';
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__channel-preview '
        .concat(unreadClass, ' ')
        .concat(activeClass),
    },
    /*#__PURE__*/ _react.default.createElement(
      'button',
      {
        onClick: onSelectChannel,
        ref: channelPreviewButton,
        'data-testid': 'channel-preview-button',
      },
      props.unread >= 1 &&
        /*#__PURE__*/ _react.default.createElement('div', {
          className: 'str-chat__channel-preview--dot',
        }),
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        image: props.displayImage,
        name: props.displayTitle,
      }),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__channel-preview-info',
        },
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            className: 'str-chat__channel-preview-title',
          },
          props.displayTitle,
        ),
        /*#__PURE__*/ _react.default.createElement(
          'span',
          {
            className: 'str-chat__channel-preview-last-message',
          },
          (0, _utils.truncate)(props.latestMessage, props.latestMessageLength),
        ),
        props.unread >= 1 &&
          /*#__PURE__*/ _react.default.createElement(
            'span',
            {
              className: 'str-chat__channel-preview-unread-count',
            },
            props.unread,
          ),
      ),
    ),
  );
};

ChannelPreviewLastMessage.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: _propTypes.default.object.isRequired,

  /** Current selected channel object */
  activeChannel: _propTypes.default.object,

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
  watchers: _propTypes.default.object,

  /** Number of unread messages */
  unread: _propTypes.default.number,

  /** If channel of component is active (selected) channel */
  active: _propTypes.default.bool,

  /** Latest message's text. */
  latestMessage: _propTypes.default.string,

  /** Length of latest message to truncate at */
  latestMessageLength: _propTypes.default.number,

  /** Title of channel to display */
  displayTitle: _propTypes.default.string,

  /** Image of channel to display */
  displayImage: _propTypes.default.string,
};
ChannelPreviewLastMessage.defaultProps = {
  latestMessageLength: 20,
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelPreviewLastMessage);

exports.default = _default;
