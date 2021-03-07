'use strict';

var _interopRequireWildcard = require('@babel/runtime/helpers/interopRequireWildcard');

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _slicedToArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/slicedToArray'),
);

var _react = _interopRequireWildcard(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

// @ts-check

/**
 * Avatar - A round avatar image with fallback to username's first letter
 *
 * @example ../../docs/Avatar.md
 * @typedef {import('types').AvatarProps} Props
 * @type { React.FC<Props>}
 */
var Avatar = function Avatar(_ref) {
  var _ref$size = _ref.size,
    size = _ref$size === void 0 ? 32 : _ref$size,
    name = _ref.name,
    _ref$shape = _ref.shape,
    shape = _ref$shape === void 0 ? 'circle' : _ref$shape,
    image = _ref.image,
    _ref$onClick = _ref.onClick,
    onClick = _ref$onClick === void 0 ? function () {} : _ref$onClick,
    _ref$onMouseOver = _ref.onMouseOver,
    onMouseOver =
      _ref$onMouseOver === void 0 ? function () {} : _ref$onMouseOver;

  var _useState = (0, _react.useState)(false),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    loaded = _useState2[0],
    setLoaded = _useState2[1];

  var _useState3 = (0, _react.useState)(false),
    _useState4 = (0, _slicedToArray2.default)(_useState3, 2),
    error = _useState4[0],
    setError = _useState4[1];

  (0, _react.useEffect)(
    function () {
      setLoaded(false);
      setError(false);
    },
    [image],
  );
  var initials = (name || '').charAt(0);
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      'data-testid': 'avatar',
      className: 'str-chat__avatar str-chat__avatar--'.concat(shape),
      title: name,
      style: {
        width: ''.concat(size, 'px'),
        height: ''.concat(size, 'px'),
        flexBasis: ''.concat(size, 'px'),
        lineHeight: ''.concat(size, 'px'),
        fontSize: ''.concat(size / 2, 'px'),
      },
      onClick: onClick,
      onMouseOver: onMouseOver,
    },
    image && !error
      ? /*#__PURE__*/ _react.default.createElement('img', {
          'data-testid': 'avatar-img',
          src: image,
          alt: initials,
          className: 'str-chat__avatar-image'.concat(
            loaded ? ' str-chat__avatar-image--loaded' : '',
          ),
          style: {
            width: ''.concat(size, 'px'),
            height: ''.concat(size, 'px'),
            flexBasis: ''.concat(size, 'px'),
            objectFit: 'cover',
          },
          onLoad: function onLoad() {
            return setLoaded(true);
          },
          onError: function onError() {
            return setError(true);
          },
        })
      : /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            'data-testid': 'avatar-fallback',
            className: 'str-chat__avatar-fallback',
          },
          initials,
        ),
  );
};

Avatar.propTypes = {
  /** image url */
  image: _propTypes.default.string,

  /** name of the picture, used for title tag fallback */
  name: _propTypes.default.string,

  /** shape of the avatar, circle, rounded or square */
  shape: _propTypes.default.oneOf(['circle', 'rounded', 'square']),

  /** size in pixels */
  size: _propTypes.default.number,

  /** click event handler */
  onClick: _propTypes.default.func,

  /** mouseOver event handler */
  onMouseOver: _propTypes.default.func,
};
var _default = Avatar;
exports.default = _default;
