'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

// @ts-check

/**
 * @type {React.FC<import('types').CommandItemProps>}
 */
var CommandItem = function CommandItem(_ref) {
  var entity = _ref.entity;
  return /*#__PURE__*/ _react.default.createElement(
    'div',
    {
      className: 'str-chat__slash-command',
    },
    /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__slash-command-header',
      },
      /*#__PURE__*/ _react.default.createElement('strong', null, entity.name),
      ' ',
      entity.args,
    ),
    /*#__PURE__*/ _react.default.createElement('br', null),
    /*#__PURE__*/ _react.default.createElement(
      'span',
      {
        className: 'str-chat__slash-command-description',
      },
      entity.description,
    ),
  );
};

CommandItem.propTypes = {
  entity: _propTypes.default.shape({
    /** Name of the command */
    name: _propTypes.default.string,

    /** Arguments of command */
    args: _propTypes.default.string,

    /** Description of command */
    description: _propTypes.default.string,
  }).isRequired,
};

var _default = /*#__PURE__*/ _react.default.memo(CommandItem);

exports.default = _default;
