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

var _ChatDown = require('../ChatDown');

var _Loading = require('../Loading');

var _context = require('../../context');

var _strChat__iconChevronDown = _interopRequireDefault(
  require('../../assets/str-chat__icon-chevron-down.svg'),
);

// @ts-check

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ../../docs/ChannelList.md
 * @type React.FC<import('types').ChannelListUIComponentProps>
 */
var ChannelListTeam = function ChannelListTeam(_ref) {
  var _ref$error = _ref.error,
    error = _ref$error === void 0 ? false : _ref$error,
    loading = _ref.loading,
    sidebarImage = _ref.sidebarImage,
    showSidebar = _ref.showSidebar,
    _ref$Avatar = _ref.Avatar,
    Avatar = _ref$Avatar === void 0 ? _Avatar.Avatar : _ref$Avatar,
    _ref$LoadingErrorIndi = _ref.LoadingErrorIndicator,
    LoadingErrorIndicator =
      _ref$LoadingErrorIndi === void 0
        ? _ChatDown.ChatDown
        : _ref$LoadingErrorIndi,
    _ref$LoadingIndicator = _ref.LoadingIndicator,
    LoadingIndicator =
      _ref$LoadingIndicator === void 0
        ? _Loading.LoadingChannels
        : _ref$LoadingIndicator,
    children = _ref.children;

  var _useContext = (0, _react.useContext)(_context.ChatContext),
    client = _useContext.client;

  var _ref2 = client.user || {},
    id = _ref2.id,
    image = _ref2.image,
    name = _ref2.name,
    status = _ref2.status;

  if (error) {
    return /*#__PURE__*/ _react.default.createElement(LoadingErrorIndicator, {
      type: 'Connection Error',
    });
  }

  if (loading) {
    return /*#__PURE__*/ _react.default.createElement(LoadingIndicator, null);
  }

  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__channel-list-team',
    },
    showSidebar &&
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__channel-list-team__sidebar',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__channel-list-team__sidebar--top',
          },
          /*#__PURE__*/ _react.default.createElement(Avatar, {
            image: sidebarImage,
            size: 50,
          }),
        ),
      ),
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'str-chat__channel-list-team__main',
      },
      /*#__PURE__*/ _react.default.createElement(
        'div',
        {
          className: 'str-chat__channel-list-team__header',
        },
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__channel-list-team__header--left',
          },
          /*#__PURE__*/ _react.default.createElement(Avatar, {
            image: image,
            name: name || id,
            size: 40,
          }),
        ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__channel-list-team__header--middle',
          },
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__channel-list-team__header--title',
            },
            name || id,
          ),
          /*#__PURE__*/ _react.default.createElement(
            'div',
            {
              className: 'str-chat__channel-list-team__header--status '.concat(
                status,
              ),
            },
            status,
          ),
        ),
        /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'str-chat__channel-list-team__header--right',
          },
          /*#__PURE__*/ _react.default.createElement(
            'button',
            {
              className: 'str-chat__channel-list-team__header--button',
            },
            /*#__PURE__*/ _react.default.createElement('img', {
              src: _strChat__iconChevronDown.default,
            }),
          ),
        ),
      ),
      children,
    ),
  );
};

ChannelListTeam.propTypes = {
  /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
  loading: _propTypes.default.bool,

  /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
  error: _propTypes.default.bool,

  /** When true, sidebar containing logo of the team is visible */
  showSidebar: _propTypes.default.bool,

  /** Url for sidebar logo image. */
  sidebarImage: _propTypes.default.string,

  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar:
    /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */
    _propTypes.default.elementType,

  /**
   * Loading indicator UI Component. It will be displayed if `loading` prop is true.
   *
   * Defaults to and accepts same props as:
   * [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js)
   *
   */
  LoadingIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').LoadingIndicatorProps>>} */
    _propTypes.default.elementType,

  /**
   * Error indicator UI Component. It will be displayed if `error` prop is true
   *
   * Defaults to and accepts same props as:
   * [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js)
   *
   */
  LoadingErrorIndicator:
    /** @type {PropTypes.Validator<React.ElementType<import('types').ChatDownProps>>} */
    _propTypes.default.elementType,
};
var _default = ChannelListTeam;
exports.default = _default;
