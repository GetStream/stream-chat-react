'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _useChat2 = require('./hooks/useChat');

var _context = require('../../context');

/**
 * Chat - Wrapper component for Chat. The needs to be placed around any other chat components.
 * This Chat component provides the ChatContext to all other components.
 *
 * The ChatContext provides the following props:
 *
 * - client (the client connection)
 * - channels (the list of channels)
 * - setActiveChannel (a function to set the currently active channel)
 * - channel (the currently active channel)
 *
 * It also exposes the withChatContext HOC which you can use to consume the ChatContext
 *
 * @example ../../docs/Chat.md
 * @typedef {import('stream-chat').Channel | undefined} ChannelState
 * @type {React.FC<import('types').ChatProps>}
 */
var Chat = function Chat(props) {
  var children = props.children,
    client = props.client,
    i18nInstance = props.i18nInstance,
    _props$initialNavOpen = props.initialNavOpen,
    initialNavOpen =
      _props$initialNavOpen === void 0 ? true : _props$initialNavOpen,
    _props$theme = props.theme,
    theme = _props$theme === void 0 ? 'messaging light' : _props$theme;

  var _useChat = (0, _useChat2.useChat)({
      client,
      initialNavOpen,
      i18nInstance,
    }),
    channel = _useChat.channel,
    closeMobileNav = _useChat.closeMobileNav,
    mutes = _useChat.mutes,
    navOpen = _useChat.navOpen,
    openMobileNav = _useChat.openMobileNav,
    setActiveChannel = _useChat.setActiveChannel,
    translators = _useChat.translators;

  if (!translators.t) return null;
  return /*#__PURE__*/ _react.default.createElement(
    _context.ChatContext.Provider,
    {
      value: {
        client,
        channel,
        closeMobileNav,
        mutes,
        navOpen,
        openMobileNav,
        setActiveChannel,
        theme,
      },
    },
    /*#__PURE__*/ _react.default.createElement(
      _context.TranslationContext.Provider,
      {
        value: translators,
      },
      children,
    ),
  );
};

Chat.propTypes = {
  /** The StreamChat client object */
  client:
    /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */
    _propTypes.default.object.isRequired,

  /**
   *
   * Theme could be used for custom styling of the components.
   *
   * You can override the classes used in our components under parent theme class.
   *
   * e.g. If you want to build a theme where background of message is black
   *
   * ```
   *  <Chat client={client} theme={demo}>
   *    <Channel>
   *      <MessageList />
   *    </Channel>
   *  </Chat>
   * ```
   *
   * ```scss
   *  .demo.str-chat {
   *    .str-chat__message-simple {
   *      &-text-inner {
   *        background-color: black;
   *      }
   *    }
   *  }
   * ```
   *
   * Built in available themes:
   *
   *  - `messaging light`
   *  - `messaging dark`
   *  - `team light`
   *  - `team dark`
   *  - `commerce light`
   *  - `commerce dark`
   *  - `livestream light`
   *  - `livestream dark`
   */
  theme: _propTypes.default.string,

  /** navOpen initial status */
  initialNavOpen: _propTypes.default.bool,
};
var _default = Chat;
exports.default = _default;
