'use strict';

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault');

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = void 0;

var _react = _interopRequireDefault(require('react'));

// eslint-disable-next-line react/display-name
var Item = /*#__PURE__*/ _react.default.forwardRef(function (props, innerRef) {
  var className = props.className,
    Component = props.component,
    item = props.item,
    onClickHandler = props.onClickHandler,
    onSelectHandler = props.onSelectHandler,
    selected = props.selected,
    style = props.style;

  var selectItem = function selectItem() {
    return onSelectHandler(item);
  };

  return /*#__PURE__*/ _react.default.createElement(
    'li',
    {
      className: 'rta__item '.concat(className || ''),
      style: style,
    },
    /*#__PURE__*/ _react.default.createElement(
      'div',
      {
        className: 'rta__entity '.concat(
          selected ? 'rta__entity--selected' : '',
        ),
        onClick: onClickHandler,
        onFocus: selectItem,
        onMouseEnter: selectItem,
        ref: innerRef,
        role: 'button',
        tabIndex: 0,
      },
      /*#__PURE__*/ _react.default.createElement(Component, {
        selected: selected,
        entity: item,
      }),
    ),
  );
});

var _default = Item;
exports.default = _default;
