'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _Avatar = require('../Avatar');

var _context = require('../../context');

// @ts-check

/**
 * EventComponent - Custom render component for system and channel event messages
 * @type {React.FC<import('types').EventComponentProps>}
 */
var EventComponent = function EventComponent(_ref) {
  var _ref$Avatar = _ref.Avatar,
    Avatar = _ref$Avatar === void 0 ? _Avatar.Avatar : _ref$Avatar,
    message = _ref.message;

  var _useContext = (0, _react.useContext)(_context.TranslationContext),
    tDateTimeParser = _useContext.tDateTimeParser;

  var type = message.type,
    text = message.text,
    event = message.event,
    _message$created_at = message.created_at,
    created_at = _message$created_at === void 0 ? '' : _message$created_at;
  if (type === 'system')
    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__message--system',
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message--system__text',
        },
        /*#__PURE__*/ _react.default.createElement('div', {
          className: 'str-chat__message--system__line',
        }),
        /*#__PURE__*/ _react.default.createElement('p', null, text),
        /*#__PURE__*/ _react.default.createElement('div', {
          className: 'str-chat__message--system__line',
        }),
      ),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__message--system__date',
        },
        /*#__PURE__*/ _react.default.createElement(
          'strong',
          null,
          tDateTimeParser(created_at).format('dddd'),
          ' ',
        ),
        'at ',
        tDateTimeParser(created_at).format('hh:mm A'),
      ),
    );

  if (
    type === 'channel.event' &&
    event &&
    (event.type === 'member.removed' || event.type === 'member.added')
  ) {
    var _event$user, _event$user2, _event$user3;

    var name =
      (event === null || event === void 0
        ? void 0
        : (_event$user = event.user) === null || _event$user === void 0
        ? void 0
        : _event$user.name) ||
      (event === null || event === void 0
        ? void 0
        : (_event$user2 = event.user) === null || _event$user2 === void 0
        ? void 0
        : _event$user2.id);
    var sentence = ''
      .concat(name, ' ')
      .concat(
        event.type === 'member.added'
          ? 'has joined the chat'
          : 'was removed from the chat',
      );
    return /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__event-component__channel-event',
      },
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        image:
          event === null || event === void 0
            ? void 0
            : (_event$user3 = event.user) === null || _event$user3 === void 0
            ? void 0
            : _event$user3.image,
        name: name,
      }),
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__event-component__channel-event__content',
        },
        /*#__PURE__*/ _react.default.createElement(
          'em',
          {
            className: 'str-chat__event-component__channel-event__sentence',
          },
          sentence,
        ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__event-component__channel-event__date',
          },
          tDateTimeParser(created_at).format('LT'),
        ),
      ),
    );
  }

  return null;
};

EventComponent.propTypes = {
  /** Message object */
  // @ts-expect-error
  message: _propTypes.default.object.isRequired,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,
};

var _default = /*#__PURE__*/ _react.default.memo(EventComponent);

exports.default = _default;
