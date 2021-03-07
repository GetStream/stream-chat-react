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

/**
 * ChannelHeader - Render some basic information about this channel
 * @example ../../docs/ChannelHeader.md
 * @type {React.FC<import('types').ChannelHeaderProps>}
 */
var ChannelHeader = function ChannelHeader(props) {
  var _props$Avatar = props.Avatar,
    Avatar = _props$Avatar === void 0 ? _Avatar.Avatar : _props$Avatar,
    propImage = props.image,
    live = props.live,
    title = props.title;

  var _useContext = (0, _react.useContext)(_context.ChannelContext),
    channel = _useContext.channel,
    watcher_count = _useContext.watcher_count;

  var _useContext2 = (0, _react.useContext)(_context.ChatContext),
    openMobileNav = _useContext2.openMobileNav;

  var _useContext3 = (0, _react.useContext)(_context.TranslationContext),
    t = _useContext3.t;

  var _ref =
      (channel === null || channel === void 0 ? void 0 : channel.data) || {},
    channelImage = _ref.image,
    member_count = _ref.member_count,
    name = _ref.name,
    subtitle = _ref.subtitle;

  var image = propImage || channelImage;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__header-livestream',
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__header-hamburger',
        onClick: openMobileNav,
      },
      /*#__PURE__*/ _react.default.createElement('span', {
        className: 'str-chat__header-hamburger--line',
      }),
      /*#__PURE__*/ _react.default.createElement('span', {
        className: 'str-chat__header-hamburger--line',
      }),
      /*#__PURE__*/ _react.default.createElement('span', {
        className: 'str-chat__header-hamburger--line',
      }),
    ),
    image &&
      /*#__PURE__*/ _react.default.createElement(Avatar, {
        image: image,
        shape: 'rounded',
        size:
          (channel === null || channel === void 0 ? void 0 : channel.type) ===
          'commerce'
            ? 60
            : 40,
      }),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__header-livestream-left',
      },
      /*#__PURE__*/ _react.default.createElement(
        'p',
        {
          className: 'str-chat__header-livestream-left--title',
        },
        title || name,
        ' ',
        live &&
          /*#__PURE__*/ _react.default.createElement(
            'span',
            {
              className: 'str-chat__header-livestream-left--livelabel',
            },
            t('live'),
          ),
      ),
      subtitle &&
        /*#__PURE__*/ _react.default.createElement(
          'p',
          {
            className: 'str-chat__header-livestream-left--subtitle',
          },
          subtitle,
        ),
      /*#__PURE__*/ _react.default.createElement(
        'p',
        {
          className: 'str-chat__header-livestream-left--members',
        },
        !live &&
          !!member_count &&
          member_count > 0 &&
          /*#__PURE__*/ _react.default.createElement(
            _react.default.Fragment,
            null,
            t('{{ memberCount }} members', {
              memberCount: member_count,
            }),
            ',',
            ' ',
          ),
        t('{{ watcherCount }} online', {
          watcherCount: watcher_count,
        }),
      ),
    ),
  );
};

ChannelHeader.propTypes = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /** Manually set the image to render, defaults to the channel image */
  image: _propTypes.default.string,

  /** Show a little indicator that the channel is live right now */
  live: _propTypes.default.bool,

  /** Set title manually */
  title: _propTypes.default.string,
};

var _default = /*#__PURE__*/ _react.default.memo(ChannelHeader);

exports.default = _default;
