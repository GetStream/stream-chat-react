'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

// @ts-check

/** @type {React.FC<import("types").EmoticonItemProps>} */
var EmoticonItem = function EmoticonItem(_ref) {
  var entity = _ref.entity;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__emoji-item',
    },
    /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__emoji-item--entity',
      },
      entity.native,
    ),
    /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__emoji-item--name',
      },
      entity.name,
    ),
  );
};

EmoticonItem.propTypes = {
  entity: _propTypes.default.shape({
    /** Name for emoticon */
    name: _propTypes.default.string.isRequired,

    /** Native value or actual emoticon */
    native: _propTypes.default.string.isRequired,
  }).isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(EmoticonItem);

exports.default = _default;
