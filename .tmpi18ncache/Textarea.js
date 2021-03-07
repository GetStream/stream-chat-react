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

var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck'),
);

var _createClass2 = _interopRequireDefault(
  require('@babel/runtime/helpers/createClass'),
);

var _assertThisInitialized2 = _interopRequireDefault(
  require('@babel/runtime/helpers/assertThisInitialized'),
);

var _inherits2 = _interopRequireDefault(
  require('@babel/runtime/helpers/inherits'),
);

var _possibleConstructorReturn2 = _interopRequireDefault(
  require('@babel/runtime/helpers/possibleConstructorReturn'),
);

var _getPrototypeOf2 = _interopRequireDefault(
  require('@babel/runtime/helpers/getPrototypeOf'),
);

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty'),
);

var _react = _interopRequireDefault(require('react'));

var _propTypes = _interopRequireDefault(require('prop-types'));

var _reactTextareaAutosize = _interopRequireDefault(
  require('react-textarea-autosize'),
);

var _textareaCaret = _interopRequireDefault(require('textarea-caret'));

var _customEvent = _interopRequireDefault(require('custom-event'));

var _reactIs = require('react-is');

var _listener = _interopRequireWildcard(require('./listener'));

var _List = _interopRequireDefault(require('./List'));

var _utils = require('./utils');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly)
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        (0, _defineProperty2.default)(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key),
        );
      });
    }
  }
  return target;
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = (0, _getPrototypeOf2.default)(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = (0, _getPrototypeOf2.default)(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return (0, _possibleConstructorReturn2.default)(this, result);
  };
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === 'undefined' || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === 'function') return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

var ReactTextareaAutocomplete = /*#__PURE__*/ (function (_React$Component) {
  (0, _inherits2.default)(ReactTextareaAutocomplete, _React$Component);

  var _super = _createSuper(ReactTextareaAutocomplete);

  function ReactTextareaAutocomplete(_props) {
    var _this;

    (0, _classCallCheck2.default)(this, ReactTextareaAutocomplete);
    _this = _super.call(this, _props);
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'getSelectionPosition',
      function () {
        if (!_this.textareaRef) return null;
        return {
          selectionStart: _this.textareaRef.selectionStart,
          selectionEnd: _this.textareaRef.selectionEnd,
        };
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'getSelectedText',
      function () {
        if (!_this.textareaRef) return null;
        var _this$textareaRef = _this.textareaRef,
          selectionStart = _this$textareaRef.selectionStart,
          selectionEnd = _this$textareaRef.selectionEnd;
        if (selectionStart === selectionEnd) return null;
        return _this.state.value.substr(
          selectionStart,
          selectionEnd - selectionStart,
        );
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'setCaretPosition',
      function () {
        var position =
          arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
        if (!_this.textareaRef) return;

        _this.textareaRef.focus();

        _this.textareaRef.setSelectionRange(position, position);
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      'getCaretPosition',
      function () {
        if (!_this.textareaRef) return 0;
        return _this.textareaRef.selectionEnd;
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_onEnter',
      function (event) {
        if (!_this.textareaRef) return;
        var trigger = _this.state.currentTrigger;

        var hasFocus = _this.textareaRef.matches(':focus');

        console.log('trigger IS:', trigger);
        console.log('hasFOCUS:', hasFocus); // don't submit if the element doesn't have focus or the shift key is pressed, unless shift+Enter was provided as submit keys

        if (
          !hasFocus ||
          (event.shiftKey === true &&
            (_this.props.keycodeSubmitKeys !== null || undefined) &&
            !_this.props.keycodeSubmitKeys.includes(event.shiftKey && 13))
        ) {
          console.log('in the return return');
          return;
        }

        console.log('this.state.data', _this.state.data);

        if (!trigger || !_this.state.data) {
          // trigger a submit
          _this._replaceWord();

          if (_this.textareaRef) {
            _this.textareaRef.selectionEnd = 0;
          }

          console.log('in the handleSUBMIT');

          _this.props.handleSubmit(event);
        }
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_onSpace',
      function () {
        if (!_this.props.replaceWord || !_this.textareaRef) return; // don't change characters if the element doesn't have focus

        var hasFocus = _this.textareaRef.matches(':focus');

        if (!hasFocus) return;

        _this._replaceWord();
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_replaceWord',
      function () {
        var value = _this.state.value;
        var lastWordRegex = /([^\s]+)(\s*)$/;
        var match = lastWordRegex.exec(
          value.slice(0, _this.getCaretPosition()),
        );
        var lastWord = match && match[1];
        if (!lastWord) return;
        var spaces = match[2];

        var newWord = _this.props.replaceWord(lastWord);

        if (newWord == null) return;
        var textBeforeWord = value.slice(
          0,
          _this.getCaretPosition() - match[0].length,
        );
        var textAfterCaret = value.slice(_this.getCaretPosition(), -1);
        var newText = textBeforeWord + newWord + spaces + textAfterCaret;

        _this.setState(
          {
            value: newText,
          },
          function () {
            // fire onChange event after successful selection
            var e = new _customEvent.default('change', {
              bubbles: true,
            });

            _this.textareaRef.dispatchEvent(e);

            if (_this.props.onChange) _this.props.onChange(e);
          },
        );
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_onSelect',
      function (newToken) {
        var onChange = _this.props.onChange;
        var _this$state = _this.state,
          currentTrigger = _this$state.currentTrigger,
          selectionEnd = _this$state.selectionEnd,
          textareaValue = _this$state.value;
        if (!currentTrigger) return;

        var computeCaretPosition = function computeCaretPosition(
          position,
          token,
          startToken,
        ) {
          switch (position) {
            case 'start':
              return startToken;

            case 'next':
            case 'end':
              return startToken + token.length;

            default:
              if (!Number.isInteger(position)) {
                throw new Error(
                  'RTA: caretPosition should be "start", "next", "end" or number.',
                );
              }

              return position;
          }
        };

        var textToModify = textareaValue.slice(0, selectionEnd);
        var startOfTokenPosition = textToModify.search(
          /**
           * It's important to escape the currentTrigger char for chars like [, (,...
           */
          new RegExp(
            '\\'.concat(
              currentTrigger,
              '[^\\'.concat(currentTrigger, '\\s', ']'),
              '*$',
            ),
          ),
        ); // we add space after emoji is selected if a caret position is next

        var newTokenString =
          newToken.caretPosition === 'next'
            ? ''.concat(newToken.text, ' ')
            : newToken.text;
        var newCaretPosition = computeCaretPosition(
          newToken.caretPosition,
          newTokenString,
          startOfTokenPosition,
        );
        var modifiedText =
          textToModify.substring(0, startOfTokenPosition) + newTokenString; // set the new textarea value and after that set the caret back to its position

        _this.setState(
          {
            value: textareaValue.replace(textToModify, modifiedText),
            dataLoading: false,
          },
          function () {
            // fire onChange event after successful selection
            var e = new _customEvent.default('change', {
              bubbles: true,
            });

            _this.textareaRef.dispatchEvent(e);

            if (onChange) onChange(e);

            _this.setCaretPosition(newCaretPosition);
          },
        );

        _this._closeAutocomplete();
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_getItemOnSelect',
      function () {
        var currentTrigger = _this.state.currentTrigger;

        var triggerSettings = _this._getCurrentTriggerSettings();

        if (!currentTrigger || !triggerSettings) return null;
        var callback = triggerSettings.callback;
        if (!callback) return null;
        return function (item) {
          if (typeof callback !== 'function') {
            throw new Error(
              'Output functor is not defined! You have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type',
            );
          }

          if (callback) {
            return callback(item, currentTrigger);
          }

          return null;
        };
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_getTextToReplace',
      function () {
        var _this$state2 = _this.state,
          actualToken = _this$state2.actualToken,
          currentTrigger = _this$state2.currentTrigger;

        var triggerSettings = _this._getCurrentTriggerSettings();

        if (!currentTrigger || !triggerSettings) return null;
        var output = triggerSettings.output;
        return function (item) {
          if (
            typeof item === 'object' &&
            (!output || typeof output !== 'function')
          ) {
            throw new Error(
              'Output functor is not defined! If you are using items as object you have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type',
            );
          }

          if (output) {
            var textToReplace = output(item, currentTrigger);

            if (!textToReplace || typeof textToReplace === 'number') {
              throw new Error(
                'Output functor should return string or object in shape {text: string, caretPosition: string | number}.\nGot "'
                  .concat(
                    String(textToReplace),
                    '". Check the implementation for trigger "',
                  )
                  .concat(currentTrigger, '" and its token "')
                  .concat(
                    actualToken,
                    '"\n\nSee https://github.com/webscopeio/react-textarea-autocomplete#trigger-type for more informations.\n',
                  ),
              );
            }

            if (typeof textToReplace === 'string') {
              return {
                text: textToReplace,
                caretPosition: _utils.DEFAULT_CARET_POSITION,
              };
            }

            if (!textToReplace.text) {
              throw new Error(
                'Output "text" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "'
                  .concat(currentTrigger, '" and its token "')
                  .concat(actualToken, '"\n'),
              );
            }

            if (!textToReplace.caretPosition) {
              throw new Error(
                'Output "caretPosition" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "'
                  .concat(currentTrigger, '" and its token "')
                  .concat(actualToken, '"\n'),
              );
            }

            return textToReplace;
          }

          if (typeof item !== 'string') {
            throw new Error('Output item should be string\n');
          }

          return {
            caretPosition: _utils.DEFAULT_CARET_POSITION,
            text: ''.concat(currentTrigger).concat(item).concat(currentTrigger),
          };
        };
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_getCurrentTriggerSettings',
      function () {
        var currentTrigger = _this.state.currentTrigger;
        if (!currentTrigger) return null;
        return _this.props.trigger[currentTrigger];
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_getValuesFromProvider',
      function () {
        var _this$state3 = _this.state,
          actualToken = _this$state3.actualToken,
          currentTrigger = _this$state3.currentTrigger;

        var triggerSettings = _this._getCurrentTriggerSettings();

        if (!currentTrigger || !triggerSettings) return;
        var dataProvider = triggerSettings.dataProvider,
          component = triggerSettings.component;

        if (typeof dataProvider !== 'function') {
          throw new Error('Trigger provider has to be a function!');
        }

        _this.setState({
          dataLoading: true,
        }); // Modified: send the full text to support / style commands

        dataProvider(actualToken, _this.state.value, function (data, token) {
          // Make sure that the result is still relevant for current query
          if (token !== _this.state.actualToken) return;

          if (!Array.isArray(data)) {
            throw new Error('Trigger provider has to provide an array!');
          }

          if (!(0, _reactIs.isValidElementType)(component)) {
            throw new Error('Component should be defined!');
          } // throw away if we resolved old trigger

          if (currentTrigger !== _this.state.currentTrigger) return; // if we haven't resolved any data let's close the autocomplete

          if (!data.length) {
            _this._closeAutocomplete();

            return;
          }

          _this.setState({
            component,
            data,
            dataLoading: false,
          });
        });
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_getSuggestions',
      function () {
        var _this$state4 = _this.state,
          currentTrigger = _this$state4.currentTrigger,
          data = _this$state4.data;
        if (!currentTrigger || !data || (data && !data.length)) return null;
        return data;
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_createRegExp',
      function () {
        var trigger = _this.props.trigger; // negative lookahead to match only the trigger + the actual token = "bladhwd:adawd:word test" => ":word"
        // https://stackoverflow.com/a/8057827/2719917

        _this.tokenRegExp = new RegExp(
          '(['.concat(Object.keys(trigger).join(''), '])(?:(?!\\1)[^\\s])*$'),
        );
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_closeAutocomplete',
      function () {
        _this.setState({
          currentTrigger: null,
          data: null,
          dataLoading: false,
          left: null,
          top: null,
        });
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_cleanUpProps',
      function () {
        var props = _objectSpread({}, _this.props);

        var notSafe = [
          'additionalTextareaProps',
          'className',
          'closeOnClickOutside',
          'containerClassName',
          'containerStyle',
          'disableMentions',
          'dropdownClassName',
          'dropdownStyle',
          'grow',
          'handleSubmit',
          'innerRef',
          'itemClassName',
          'itemStyle',
          'keycodeSubmitKeys',
          'listClassName',
          'listStyle',
          'loaderClassName',
          'loaderStyle',
          'loadingComponent',
          'minChar',
          'movePopupAsYouType',
          'onCaretPositionChange',
          'onChange',
          'ref',
          'replaceWord',
          'scrollToItem',
          'SuggestionList',
          'trigger',
          'value',
        ]; // eslint-disable-next-line

        for (var prop in props) {
          if (notSafe.includes(prop)) delete props[prop];
        }

        return props;
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_isCommand',
      function (text) {
        if (text[0] !== '/') return false;
        var tokens = text.split(' ');
        if (tokens.length > 1) return false;
        return true;
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_changeHandler',
      function (e) {
        var _this$props = _this.props,
          minChar = _this$props.minChar,
          movePopupAsYouType = _this$props.movePopupAsYouType,
          onCaretPositionChange = _this$props.onCaretPositionChange,
          onChange = _this$props.onChange,
          trigger = _this$props.trigger;
        var _this$state5 = _this.state,
          left = _this$state5.left,
          top = _this$state5.top;
        var textarea = e.target;
        var selectionEnd = textarea.selectionEnd,
          selectionStart = textarea.selectionStart,
          value = textarea.value;

        if (onChange) {
          e.persist();
          onChange(e);
        }

        if (onCaretPositionChange)
          onCaretPositionChange(_this.getCaretPosition());

        _this.setState({
          value,
        });

        var currentTrigger;
        var lastToken;

        if (_this._isCommand(value)) {
          currentTrigger = '/';
          lastToken = value;
        } else {
          var tokenMatch = value
            .slice(0, selectionEnd)
            .match(/(?!^|\W)?[:@][^\s]*\s?[^\s]*$/g);
          lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();
          currentTrigger =
            (lastToken &&
              Object.keys(trigger).find(function (a) {
                return a === lastToken[0];
              })) ||
            null;
        }
        /*
       if we lost the trigger token or there is no following character we want to close
       the autocomplete
      */

        if (!lastToken || lastToken.length <= minChar) {
          _this._closeAutocomplete();

          return;
        }

        var actualToken = lastToken.slice(1); // if trigger is not configured step out from the function, otherwise proceed

        if (!currentTrigger) return;

        if (
          movePopupAsYouType ||
          (top === null && left === null) || // if we have single char - trigger it means we want to re-position the autocomplete
          lastToken.length === 1
        ) {
          var _getCaretCoordinates = (0, _textareaCaret.default)(
              textarea,
              selectionEnd,
            ),
            newTop = _getCaretCoordinates.top,
            newLeft = _getCaretCoordinates.left;

          _this.setState({
            // make position relative to textarea
            left: newLeft,
            top: newTop - _this.textareaRef.scrollTop || 0,
          });
        }

        _this.setState(
          {
            actualToken,
            currentTrigger,
            selectionEnd,
            selectionStart,
          },
          function () {
            try {
              _this._getValuesFromProvider();
            } catch (err) {
              (0, _utils.errorMessage)(err.message);
            }
          },
        );
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_selectHandler',
      function (e) {
        var _this$props2 = _this.props,
          onCaretPositionChange = _this$props2.onCaretPositionChange,
          onSelect = _this$props2.onSelect;
        if (onCaretPositionChange)
          onCaretPositionChange(_this.getCaretPosition());

        if (onSelect) {
          e.persist();
          onSelect(e);
        }
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_onClickAndBlurHandler',
      function (e) {
        var _this$props3 = _this.props,
          closeOnClickOutside = _this$props3.closeOnClickOutside,
          onBlur = _this$props3.onBlur; // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
        // that was actually clicked. If we clicked inside the auto-select dropdown, then
        // that's not a blur, from the auto-select point of view, so then do nothing.

        var el = e.relatedTarget;

        if (
          _this.dropdownRef &&
          el instanceof Node &&
          _this.dropdownRef.contains(el)
        ) {
          return;
        }

        if (closeOnClickOutside) _this._closeAutocomplete();

        if (onBlur) {
          e.persist();
          onBlur(e);
        }
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_onScrollHandler',
      function () {
        return _this._closeAutocomplete();
      },
    );
    (0, _defineProperty2.default)(
      (0, _assertThisInitialized2.default)(_this),
      '_dropdownScroll',
      function (item) {
        var scrollToItem = _this.props.scrollToItem;
        if (!scrollToItem) return;

        if (scrollToItem === true) {
          (0, _utils.defaultScrollToItem)(_this.dropdownRef, item);
          return;
        }

        if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
          throw new Error(
            '`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.',
          );
        }

        scrollToItem(_this.dropdownRef, item);
      },
    );
    var _this$props4 = _this.props,
      loadingComponent = _this$props4.loadingComponent,
      _trigger = _this$props4.trigger,
      _value = _this$props4.value; // TODO: it would be better to have the parent control state...
    // if (value) this.state.value = value;

    _this._createRegExp();

    if (!loadingComponent) {
      throw new Error('RTA: loadingComponent is not defined');
    }

    if (!_trigger) {
      throw new Error('RTA: trigger is not defined');
    }

    _this.state = {
      actualToken: '',
      component: null,
      currentTrigger: null,
      data: null,
      dataLoading: false,
      left: null,
      listenerIndex: 0,
      selectionEnd: 0,
      selectionStart: 0,
      value: _value || '',
      top: null,
    };
    return _this;
  }

  (0, _createClass2.default)(ReactTextareaAutocomplete, [
    {
      key: 'componentDidMount',
      value: function componentDidMount() {
        var _this2 = this;

        // Listeners.add(KEY_CODES.ESC, () => this._closeAutocomplete());
        // Listeners.add(KEY_CODES.SPACE, () => this._onSpace());
        var listenerIndex = 0;

        if (this.props.keycodeSubmitKeys) {
          var newSubmitKeys = this.props.keycodeSubmitKeys; // If the provided new submission keys are not valid, submission is still the default Enter

          if (_listener.default.checkKeycodeSubmitValues(newSubmitKeys)) {
            listenerIndex = _listener.default.add(newSubmitKeys, function (e) {
              return _this2._onEnter(e);
            });
          } else {
            listenerIndex = _listener.default.add(
              _listener.KEY_CODES.ENTER,
              function (e) {
                return _this2._onEnter(e);
              },
            );
          }
        } else {
          listenerIndex = _listener.default.add(
            _listener.KEY_CODES.ENTER,
            function (e) {
              return _this2._onEnter(e);
            },
          );
        }

        this.setState({
          listenerIndex,
        });

        _listener.default.startListen();
      },
    },
    {
      key: 'UNSAFE_componentWillReceiveProps',
      value: function UNSAFE_componentWillReceiveProps(nextProps) {
        this._update(nextProps);
      },
    },
    {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        _listener.default.stopListen();

        _listener.default.remove(this.state.listenerIndex);
      },
    },
    {
      key: '_update',
      // TODO: This is an anti pattern in react, should come up with a better way
      value: function _update(_ref) {
        var value = _ref.value,
          trigger = _ref.trigger;
        var oldValue = this.state.value;
        var oldTrigger = this.props.trigger;
        if (value !== oldValue || !oldValue)
          this.setState({
            value,
          });
        /**
         * check if trigger chars are changed, if so, change the regexp accordingly
         */

        if (
          Object.keys(trigger).join('') !== Object.keys(oldTrigger).join('')
        ) {
          this._createRegExp();
        }
      },
      /**
       * Close autocomplete, also clean up trigger (to avoid slow promises)
       */
    },
    {
      key: 'render',
      value: function render() {
        var _this3 = this;

        var _this$props5 = this.props,
          className = _this$props5.className,
          containerClassName = _this$props5.containerClassName,
          containerStyle = _this$props5.containerStyle,
          disableMentions = _this$props5.disableMentions,
          dropdownClassName = _this$props5.dropdownClassName,
          dropdownStyle = _this$props5.dropdownStyle,
          itemClassName = _this$props5.itemClassName,
          itemStyle = _this$props5.itemStyle,
          listClassName = _this$props5.listClassName,
          style = _this$props5.style,
          _this$props5$Suggesti = _this$props5.SuggestionList,
          SuggestionList =
            _this$props5$Suggesti === void 0
              ? _List.default
              : _this$props5$Suggesti;
        var maxRows = this.props.maxRows;
        var _this$state6 = this.state,
          component = _this$state6.component,
          currentTrigger = _this$state6.currentTrigger,
          dataLoading = _this$state6.dataLoading,
          value = _this$state6.value;

        var selectedItem = this._getItemOnSelect();

        var suggestionData = this._getSuggestions();

        var textToReplace = this._getTextToReplace();

        var SuggestionListContainer = function SuggestionListContainer() {
          if (
            (dataLoading || suggestionData) &&
            currentTrigger &&
            !(disableMentions && currentTrigger === '@')
          ) {
            return /*#__PURE__*/ _react.default.createElement(
              'div',
              {
                className: 'rta__autocomplete '.concat(dropdownClassName || ''),
                ref: function ref(_ref2) {
                  _this3.dropdownRef = _ref2;
                },
                style: dropdownStyle,
              },
              component &&
                suggestionData &&
                textToReplace &&
                /*#__PURE__*/ _react.default.createElement(SuggestionList, {
                  className: listClassName,
                  component: component,
                  dropdownScroll: _this3._dropdownScroll,
                  getSelectedItem: selectedItem,
                  getTextToReplace: textToReplace,
                  itemClassName: itemClassName,
                  itemStyle: itemStyle,
                  onSelect: _this3._onSelect,
                  value: value,
                  values: suggestionData,
                }),
            );
          }

          return null;
        };

        if (!this.props.grow) maxRows = 1;
        return /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'rta '
              .concat(dataLoading === true ? 'rta--loading' : '', ' ')
              .concat(containerClassName || ''),
            style: containerStyle,
          },
          /*#__PURE__*/ _react.default.createElement(
            SuggestionListContainer,
            null,
          ),
          /*#__PURE__*/ _react.default.createElement(
            _reactTextareaAutosize.default,
            (0, _extends2.default)(
              {},
              this._cleanUpProps(),
              {
                className: 'rta__textarea '.concat(className || ''),
                maxRows: maxRows,
                onBlur: this._onClickAndBlurHandler,
                onChange: this._changeHandler,
                onClick: this._onClickAndBlurHandler,
                onFocus: this.props.onFocus,
                onScroll: this._onScrollHandler,
                onSelect: this._selectHandler,
                ref: function ref(_ref3) {
                  if (_this3.props.innerRef) _this3.props.innerRef(_ref3);
                  _this3.textareaRef = _ref3;
                },
                style: style,
                value: value,
              },
              this.props.additionalTextareaProps,
            ),
          ),
        );
      },
    },
  ]);
  return ReactTextareaAutocomplete;
})(_react.default.Component);

(0, _defineProperty2.default)(ReactTextareaAutocomplete, 'defaultProps', {
  closeOnClickOutside: true,
  maxRows: 10,
  minChar: 1,
  movePopupAsYouType: false,
  scrollToItem: true,
  value: '',
});
ReactTextareaAutocomplete.propTypes = {
  className: _propTypes.default.string,
  closeOnClickOutside: _propTypes.default.bool,
  containerClassName: _propTypes.default.string,
  containerStyle: _propTypes.default.object,
  disableMentions: _propTypes.default.bool,
  dropdownClassName: _propTypes.default.string,
  dropdownStyle: _propTypes.default.object,
  itemClassName: _propTypes.default.string,
  itemStyle: _propTypes.default.object,
  listClassName: _propTypes.default.string,
  listStyle: _propTypes.default.object,
  loaderClassName: _propTypes.default.string,
  loaderStyle: _propTypes.default.object,
  loadingComponent: _propTypes.default.elementType,
  minChar: _propTypes.default.number,
  onBlur: _propTypes.default.func,
  onCaretPositionChange: _propTypes.default.func,
  onChange: _propTypes.default.func,
  onSelect: _propTypes.default.func,
  style: _propTypes.default.object,
  SuggestionList: _propTypes.default.elementType,
  trigger: _utils.triggerPropsCheck,
  value: _propTypes.default.string,
  keycodeSubmitKeys: _propTypes.default.array,
};
var _default = ReactTextareaAutocomplete;
exports.default = _default;
