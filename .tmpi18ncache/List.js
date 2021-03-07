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

var _TranslationContext = require('../../context/TranslationContext');

var _Item = _interopRequireDefault(require('./Item'));

var _listener = require('./listener');

var List = function List(props) {
  var className = props.className,
    component = props.component,
    dropdownScroll = props.dropdownScroll,
    getSelectedItem = props.getSelectedItem,
    getTextToReplace = props.getTextToReplace,
    itemClassName = props.itemClassName,
    itemStyle = props.itemStyle,
    onSelect = props.onSelect,
    style = props.style,
    propValue = props.value,
    values = props.values;

  var _useContext = (0, _react.useContext)(
      _TranslationContext.TranslationContext,
    ),
    t = _useContext.t;

  var _useState = (0, _react.useState)(undefined),
    _useState2 = (0, _slicedToArray2.default)(_useState, 2),
    selectedItem = _useState2[0],
    setSelectedItem = _useState2[1];

  var itemsRef = {};

  var isSelected = function isSelected(item) {
    return selectedItem === values.indexOf(item);
  };

  var getId = function getId(item) {
    var textToReplace = getTextToReplace(item);

    if (textToReplace.key) {
      return textToReplace.key;
    }

    if (typeof item === 'string' || !item.key) {
      return textToReplace.text;
    }

    return item.key;
  };

  var modifyText = function modifyText(value) {
    if (!value) return;
    onSelect(getTextToReplace(value));
    if (getSelectedItem) getSelectedItem(value);
  };

  var handleClick = function handleClick(e) {
    var _e$preventDefault;

    if (e)
      (_e$preventDefault = e.preventDefault) === null ||
      _e$preventDefault === void 0
        ? void 0
        : _e$preventDefault.call(e);
    modifyText(values[selectedItem]);
  };

  var selectItem = function selectItem(item) {
    var keyboard =
      arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    setSelectedItem(values.indexOf(item));
    if (keyboard) dropdownScroll(itemsRef[getId(item)]);
  };

  var handleKeyDown = (0, _react.useCallback)(
    function (event) {
      if (event.which === _listener.KEY_CODES.UP) {
        setSelectedItem(function (prevSelected) {
          if (prevSelected === undefined) return 0;
          return prevSelected === 0 ? values.length - 1 : prevSelected - 1;
        });
      }

      if (event.which === _listener.KEY_CODES.DOWN) {
        setSelectedItem(function (prevSelected) {
          if (prevSelected === undefined) return 0;
          return prevSelected === values.length - 1 ? 0 : prevSelected + 1;
        });
      }

      if (
        (event.which === _listener.KEY_CODES.ENTER ||
          event.which === _listener.KEY_CODES.TAB) &&
        selectedItem !== undefined
      ) {
        handleClick(event);
        return setSelectedItem(undefined);
      }

      return null;
    },
    [selectedItem, values], // eslint-disable-line
  );
  (0, _react.useEffect)(
    function () {
      document.addEventListener('keydown', handleKeyDown, false);
      return function () {
        return document.removeEventListener('keydown', handleKeyDown);
      };
    },
    [handleKeyDown],
  );
  (0, _react.useEffect)(
    function () {
      if (values !== null && values !== void 0 && values.length)
        selectItem(values[0]);
    },
    [values],
  ); // eslint-disable-line

  var renderHeader = function renderHeader(value) {
    if (value[0] === '/') {
      var html = '<strong>'.concat(value.replace('/', ''), '</strong>');
      return ''.concat(t('Commands matching'), ' ').concat(html);
    }

    if (value[0] === ':') {
      var _html = '<strong>'.concat(value.replace(':', ''), '</strong>');

      return ''.concat(t('Emoji matching'), ' ').concat(_html);
    }

    if (value[0] === '@') {
      var _html2 = '<strong>'.concat(value.replace('@', ''), '</strong>');

      return ''.concat(t('People matching'), ' ').concat(_html2);
    }

    return null;
  };

  return /*#__PURE__*/ _react.default.createElement(
    'ul',
    {
      className: 'rta__list '.concat(className || ''),
      style: style,
    },
    /*#__PURE__*/ _react.default.createElement('li', {
      className: 'rta__list-header',
      dangerouslySetInnerHTML: {
        __html: renderHeader(propValue),
      },
    }),
    values.map(function (item) {
      return /*#__PURE__*/ _react.default.createElement(_Item.default, {
        className: itemClassName,
        component: component,
        item: item,
        key: getId(item),
        onClickHandler: handleClick,
        onSelectHandler: selectItem,
        ref: function ref(_ref) {
          itemsRef[getId(item)] = _ref;
        },
        selected: isSelected(item),
        style: itemStyle,
      });
    }),
  );
};

var _default = List;
exports.default = _default;
