'use strict';
//
var __extends =
  (this && this.__extends) ||
  (function() {
    var extendStatics = function(d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function(d, b) {
            d.__proto__ = b;
          }) ||
        function(d, b) {
          for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype =
        b === null
          ? Object.create(b)
          : ((__.prototype = b.prototype), new __());
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
var __importStar =
  (this && this.__importStar) ||
  function(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
var react_1 = __importDefault(require('react'));
var listener_1 = __importStar(require('./listener'));
var Item_1 = __importDefault(require('./Item'));
var List = /** @class */ (function(_super) {
  __extends(List, _super);
  function List() {
    var _this = (_super !== null && _super.apply(this, arguments)) || this;
    _this.state = {
      selectedItem: null,
    };
    _this.cachedValues = null;
    _this.onPressEnter = function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      var values = _this.props.values;
      _this.modifyText(values[_this.getPositionInList()]);
    };
    _this.getPositionInList = function() {
      var values = _this.props.values;
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return 0;
      return values.findIndex(function(a) {
        return _this.getId(a) === _this.getId(selectedItem);
      });
    };
    _this.getId = function(item) {
      var textToReplace = _this.props.getTextToReplace(item);
      if (textToReplace.key) {
        return textToReplace.key;
      }
      if (typeof item === 'string' || !item.key) {
        return textToReplace.text;
      }
      return item.key;
    };
    _this.listeners = [];
    _this.itemsRef = {};
    _this.modifyText = function(value) {
      if (!value) return;
      var _a = _this.props,
        onSelect = _a.onSelect,
        getTextToReplace = _a.getTextToReplace,
        getSelectedItem = _a.getSelectedItem;
      onSelect(getTextToReplace(value));
      if (getSelectedItem) {
        getSelectedItem(value);
      }
    };
    _this.selectItem = function(item, keyboard) {
      if (keyboard === void 0) {
        keyboard = false;
      }
      _this.setState({ selectedItem: item }, function() {
        if (keyboard) {
          _this.props.dropdownScroll(_this.itemsRef[_this.getId(item)]);
        }
      });
    };
    _this.scroll = function(e) {
      if (e && e.preventDefault) {
        e.preventDefault();
      }
      var values = _this.props.values;
      var code = e.keyCode || e.which;
      var oldPosition = _this.getPositionInList();
      var newPosition;
      switch (code) {
        case listener_1.KEY_CODES.DOWN:
          newPosition = oldPosition + 1;
          break;
        case listener_1.KEY_CODES.UP:
          newPosition = oldPosition - 1;
          break;
        default:
          newPosition = oldPosition;
          break;
      }
      newPosition =
        ((newPosition % values.length) + values.length) % values.length; // eslint-disable-line
      _this.selectItem(
        values[newPosition],
        [listener_1.KEY_CODES.DOWN, listener_1.KEY_CODES.UP].includes(code),
      );
    };
    _this.isSelected = function(item) {
      var selectedItem = _this.state.selectedItem;
      if (!selectedItem) return false;
      return _this.getId(selectedItem) === _this.getId(item);
    };
    _this.renderHeader = function(value) {
      if (value[0] === '/') {
        return (
          'Commands matching <strong>' + value.replace('/', '') + '</strong>'
        );
      }
      if (value[0] === ':') {
        return 'Emoji matching <strong>' + value.replace(':', '') + '</strong>';
      }
      if (value[0] === '@') {
        return 'Searching for people';
      }
    };
    return _this;
  }
  List.prototype.componentDidMount = function() {
    this.listeners.push(
      listener_1.default.add(
        [listener_1.KEY_CODES.DOWN, listener_1.KEY_CODES.UP],
        this.scroll,
      ),
      listener_1.default.add(
        [listener_1.KEY_CODES.ENTER, listener_1.KEY_CODES.TAB],
        this.onPressEnter,
      ),
    );
    var values = this.props.values;
    if (values && values[0]) this.selectItem(values[0]);
  };
  List.prototype.UNSAFE_componentWillReceiveProps = function(_a) {
    var _this = this;
    var values = _a.values;
    var newValues = values
      .map(function(val) {
        return _this.getId(val);
      })
      .join('');
    if (this.cachedValues !== newValues && values && values[0]) {
      this.selectItem(values[0]);
      this.cachedValues = newValues;
    }
  };
  List.prototype.componentWillUnmount = function() {
    var listener;
    while (this.listeners.length) {
      listener = this.listeners.pop();
      listener_1.default.remove(listener);
    }
  };
  List.prototype.render = function() {
    var _this = this;
    var _a = this.props,
      values = _a.values,
      component = _a.component,
      style = _a.style,
      itemClassName = _a.itemClassName,
      className = _a.className,
      itemStyle = _a.itemStyle;
    return react_1.default.createElement(
      'ul',
      { className: 'rta__list ' + (className || ''), style: style },
      react_1.default.createElement('li', {
        className: 'rta__list-header',
        dangerouslySetInnerHTML: {
          __html: this.renderHeader(this.props.value),
        },
      }),
      values.map(function(item) {
        return react_1.default.createElement(Item_1.default, {
          key: _this.getId(item),
          innerRef: function(ref) {
            _this.itemsRef[_this.getId(item)] = ref;
          },
          selected: _this.isSelected(item),
          item: item,
          className: itemClassName,
          style: itemStyle,
          onClickHandler: _this.onPressEnter,
          onSelectHandler: _this.selectItem,
          component: component,
        });
      }),
    );
  };
  return List;
})(react_1.default.Component);
exports.List = List;
exports.default = List;
