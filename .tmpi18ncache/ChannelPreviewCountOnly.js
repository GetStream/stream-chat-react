'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

/** @type {React.FC<import('types').ChannelPreviewUIComponentProps>} */
var ChannelPreviewCountOnly = function ChannelPreviewCountOnly(_ref) {
  var channel = _ref.channel,
    setActiveChannel = _ref.setActiveChannel,
    watchers = _ref.watchers,
    unread = _ref.unread,
    displayTitle = _ref.displayTitle;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: unread >= 1 ? 'unread' : '',
    },
    /*#__PURE__*/ _react.default.createElement(
      'button',
      {
        onClick: function onClick() {
          return setActiveChannel(channel, watchers);
        },
      },
      ' ',
      displayTitle,
      ' ',
      /*#__PURE__*/ _react.default.createElement('span', null, unread),
    ),
  );
};

ChannelPreviewCountOnly.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: _propTypes.default.object.isRequired,

  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
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

  /** Title of channel to display */
  displayTitle: _propTypes.default.string,
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelPreviewCountOnly);

exports.default = _default;
