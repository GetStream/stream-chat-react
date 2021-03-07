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

var _react = _interopRequireWildcard(require('react'));

var _utils = require('../../utils');

var _context = require('../../context');

var _Reactions = require('../Reactions');

var _hooks = require('./hooks');

var _utils2 = require('./utils');

var _MessageOptions = _interopRequireDefault(require('./MessageOptions'));

// @ts-check

/**
 * @type { React.FC<import('types').MessageTextProps> }
 */
var MessageTextComponent = function MessageTextComponent(props) {
  var _message$i18n;

  var _props$ReactionsList = props.ReactionsList,
    ReactionsList =
      _props$ReactionsList === void 0
        ? _Reactions.ReactionsList
        : _props$ReactionsList,
    _props$ReactionSelect = props.ReactionSelector,
    ReactionSelector =
      _props$ReactionSelect === void 0
        ? _Reactions.ReactionSelector
        : _props$ReactionSelect,
    propOnMentionsClick = props.onMentionsClickMessage,
    propOnMentionsHover = props.onMentionsHoverMessage,
    customWrapperClass = props.customWrapperClass,
    customInnerClass = props.customInnerClass,
    _props$theme = props.theme,
    theme = _props$theme === void 0 ? 'simple' : _props$theme,
    message = props.message,
    unsafeHTML = props.unsafeHTML,
    customOptionProps = props.customOptionProps;
  var reactionSelectorRef = (0, _react.useRef)(
    /** @type {HTMLDivElement | null} */
    null,
  );

  var _useMobilePress = (0, _hooks.useMobilePress)(),
    handleMobilePress = _useMobilePress.handleMobilePress;

  var _useMentionsUIHandler = (0, _hooks.useMentionsUIHandler)(message, {
      onMentionsClick: propOnMentionsClick,
      onMentionsHover: propOnMentionsHover,
    }),
    onMentionsClick = _useMentionsUIHandler.onMentionsClick,
    onMentionsHover = _useMentionsUIHandler.onMentionsHover;

  var _useReactionClick = (0, _hooks.useReactionClick)(
      message,
      reactionSelectorRef,
    ),
    onReactionListClick = _useReactionClick.onReactionListClick,
    showDetailedReactions = _useReactionClick.showDetailedReactions,
    isReactionEnabled = _useReactionClick.isReactionEnabled;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext.t,
    userLanguage = _useContext.userLanguage;

  var hasReactions = (0, _utils2.messageHasReactions)(message);
  var hasAttachment = (0, _utils2.messageHasAttachments)(message);
  var handleReaction = (0, _hooks.useReactionHandler)(message);
  var messageTextToRender = // @ts-expect-error
    (message === null || message === void 0
      ? void 0
      : (_message$i18n = message.i18n) === null || _message$i18n === void 0
      ? void 0
      : _message$i18n[''.concat(userLanguage, '_text')]) ||
    (message === null || message === void 0 ? void 0 : message.text);
  var messageMentionedUsersItem =
    message === null || message === void 0 ? void 0 : message.mentioned_users;
  var messageText = (0, _react.useMemo)(
    function () {
      return (0, _utils.renderText)(
        messageTextToRender,
        messageMentionedUsersItem,
      );
    },
    [messageMentionedUsersItem, messageTextToRender],
  );
  var wrapperClass = customWrapperClass || 'str-chat__message-text';
  var innerClass =
    customInnerClass ||
    'str-chat__message-text-inner str-chat__message-'.concat(
      theme,
      '-text-inner',
    );

  if (!(message !== null && message !== void 0 && message.text)) {
    return null;
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: wrapperClass,
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        'data-testid': 'message-text-inner-wrapper',
        className: '\n          '
          .concat(innerClass, '\n          ')
          .concat(
            hasAttachment
              ? ' str-chat__message-'.concat(
                  theme,
                  '-text-inner--has-attachment',
                )
              : '',
            '\n          ',
          )
          .concat(
            (0, _utils.isOnlyEmojis)(message.text)
              ? ' str-chat__message-'.concat(theme, '-text-inner--is-emoji')
              : '',
            '\n        ',
          )
          .trim(),
        onMouseOver: onMentionsHover,
        onClick: onMentionsClick,
      },
      message.type === 'error' &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__'.concat(theme, '-message--error-message'),
          },
          t && t('Error · Unsent'),
        ),
      message.status === 'failed' &&
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__'.concat(theme, '-message--error-message'),
          },
          t && t('Message Failed · Click to try again'),
        ),
      unsafeHTML && message.html
        ? /*#__PURE__*/ _react.default.createElement('div', {
            dangerouslySetInnerHTML: {
              __html: message.html,
            },
          })
        : /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              onClick: handleMobilePress,
            },
            messageText,
          ),
      hasReactions &&
        !showDetailedReactions &&
        isReactionEnabled &&
        /*#__PURE__*/ _react.default.createElement(ReactionsList, {
          reactions: message.latest_reactions,
          reaction_counts: message.reaction_counts || undefined,
          own_reactions: message.own_reactions,
          onClick: onReactionListClick,
          reverse: true,
        }),
      showDetailedReactions &&
        isReactionEnabled &&
        /*#__PURE__*/ _react.default.createElement(ReactionSelector, {
          handleReaction: handleReaction,
          detailedView: true,
          reaction_counts: message.reaction_counts || undefined,
          latest_reactions: message.latest_reactions,
          own_reactions: message.own_reactions,
          ref: reactionSelectorRef,
        }),
    ),
    /*#__PURE__*/ _react.default.createElement(
      _MessageOptions.default,
      (0, _extends2.default)({}, props, customOptionProps, {
        onReactionListClick: onReactionListClick,
      }),
    ),
  );
};

var _default = /*#__PURE__*/ _react.default.memo(MessageTextComponent);

exports.default = _default;
