"use strict";
//
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var prop_types_1 = __importDefault(require("prop-types"));
var textarea_caret_1 = __importDefault(require("textarea-caret"));
var custom_event_1 = __importDefault(require("custom-event"));
var listener_1 = __importStar(require("./listener"));
var List_1 = __importDefault(require("./List"));
var utils_1 = require("./utils");
var react_textarea_autosize_1 = __importDefault(require("react-textarea-autosize"));
var DEFAULT_CARET_POSITION = 'next';
var errorMessage = function (message) {
    return console.error("RTA: dataProvider fails: " + message + "\n    \nCheck the documentation or create issue if you think it's bug. https://github.com/webscopeio/react-textarea-autocomplete/issues");
};
var ReactTextareaAutocomplete = /** @class */ (function (_super) {
    __extends(ReactTextareaAutocomplete, _super);
    function ReactTextareaAutocomplete(props) {
        var _this = _super.call(this, props) || this;
        _this.getSelectionPosition = function () {
            if (!_this.textareaRef)
                return null;
            return {
                selectionStart: _this.textareaRef.selectionStart,
                selectionEnd: _this.textareaRef.selectionEnd,
            };
        };
        _this.getSelectedText = function () {
            if (!_this.textareaRef)
                return null;
            var _a = _this.textareaRef, selectionStart = _a.selectionStart, selectionEnd = _a.selectionEnd;
            if (selectionStart === selectionEnd)
                return null;
            return _this.state.value.substr(selectionStart, selectionEnd - selectionStart);
        };
        _this.setCaretPosition = function (position) {
            if (position === void 0) { position = 0; }
            if (!_this.textareaRef)
                return;
            _this.textareaRef.focus();
            _this.textareaRef.setSelectionRange(position, position);
        };
        _this.getCaretPosition = function () {
            if (!_this.textareaRef) {
                return 0;
            }
            return _this.textareaRef.selectionEnd;
        };
        // handle the on-enter behaviour
        _this._onEnter = function (event) {
            var trigger = _this.state.currentTrigger;
            if (!_this.textareaRef) {
                return;
            }
            var hasFocus = _this.textareaRef.matches(':focus');
            // don't submit if the element has focus or the shift key is pressed
            if (!hasFocus || event.shiftKey === true) {
                return;
            }
            if (!trigger) {
                // trigger a submit
                _this._replaceWord();
                if (_this.textareaRef) {
                    _this.textareaRef.selectionEnd = 0;
                }
                _this.props.handleSubmit(event);
            }
        };
        // handle the on-space behaviour
        _this._onSpace = function () {
            if (!_this.props.replaceWord) {
                return;
            }
            if (!_this.textareaRef) {
                return;
            }
            var hasFocus = _this.textareaRef.matches(':focus');
            // don't change characters if the element doesn't have focus
            if (!hasFocus) {
                return;
            }
            _this._replaceWord();
        };
        _this._replaceWord = function () {
            var lastWordRegex = /([^\s]+)(\s*)$/;
            var value = _this.state.value;
            var match = lastWordRegex.exec(value.slice(0, _this.getCaretPosition()));
            var lastWord = match && match[1];
            if (!lastWord) {
                return;
            }
            var spaces = match[2];
            var newWord = _this.props.replaceWord(lastWord);
            if (newWord == null) {
                return;
            }
            var textBeforeWord = value.slice(0, _this.getCaretPosition() - match[0].length);
            var textAfterCaret = value.slice(_this.getCaretPosition(), -1);
            var newText = textBeforeWord + newWord + spaces + textAfterCaret;
            _this.setState({
                value: newText,
            }, function () {
                // fire onChange event after successful selection
                var e = new custom_event_1.default('change', { bubbles: true });
                _this.textareaRef.dispatchEvent(e);
                if (_this.props.onChange)
                    _this.props.onChange(e);
            });
        };
        _this._onSelect = function (newToken) {
            var _a = _this.state, selectionEnd = _a.selectionEnd, currentTrigger = _a.currentTrigger, textareaValue = _a.value;
            var _b = _this.props, onChange = _b.onChange, trigger = _b.trigger;
            if (!currentTrigger)
                return;
            var computeCaretPosition = function (position, token, startToken) {
                switch (position) {
                    case 'start':
                        return startToken;
                    case 'next':
                    case 'end':
                        return startToken + token.length;
                    default:
                        if (!Number.isInteger(position)) {
                            throw new Error('RTA: caretPosition should be "start", "next", "end" or number.');
                        }
                        return position;
                }
            };
            var textToModify = textareaValue.slice(0, selectionEnd);
            var startOfTokenPosition = textToModify.search(
            /**
             * It's important to escape the currentTrigger char for chars like [, (,...
             */
            new RegExp("\\" + currentTrigger + ("[^\\" + currentTrigger + (trigger[currentTrigger].allowWhitespace ? '' : '\\s') + "]") + "*$"));
            // we add space after emoji is selected if a caret position is next
            var newTokenString = newToken.caretPosition === 'next' ? newToken.text + " " : newToken.text;
            var newCaretPosition = computeCaretPosition(newToken.caretPosition, newTokenString, startOfTokenPosition);
            var modifiedText = textToModify.substring(0, startOfTokenPosition) + newTokenString;
            // set the new textarea value and after that set the caret back to its position
            _this.setState({
                value: textareaValue.replace(textToModify, modifiedText),
                dataLoading: false,
            }, function () {
                // fire onChange event after successful selection
                var e = new custom_event_1.default('change', { bubbles: true });
                _this.textareaRef.dispatchEvent(e);
                if (onChange)
                    onChange(e);
                _this.setCaretPosition(newCaretPosition);
            });
            _this._closeAutocomplete();
        };
        _this._getItemOnSelect = function () {
            var currentTrigger = _this.state.currentTrigger;
            var triggerSettings = _this._getCurrentTriggerSettings();
            if (!currentTrigger || !triggerSettings)
                return null;
            var callback = triggerSettings.callback;
            if (!callback)
                return null;
            return function (item) {
                if (typeof callback !== 'function') {
                    throw new Error('Output functor is not defined! You have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type');
                }
                if (callback) {
                    return callback(item, currentTrigger);
                }
                return null;
            };
        };
        _this._getTextToReplace = function () {
            var _a = _this.state, currentTrigger = _a.currentTrigger, actualToken = _a.actualToken;
            var triggerSettings = _this._getCurrentTriggerSettings();
            if (!currentTrigger || !triggerSettings)
                return null;
            var output = triggerSettings.output;
            return function (item) {
                if (typeof item === 'object' &&
                    (!output || typeof output !== 'function')) {
                    throw new Error('Output functor is not defined! If you are using items as object you have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type');
                }
                if (output) {
                    var textToReplace = output(item, currentTrigger);
                    if (!textToReplace || typeof textToReplace === 'number') {
                        throw new Error("Output functor should return string or object in shape {text: string, caretPosition: string | number}.\nGot \"" + String(textToReplace) + "\". Check the implementation for trigger \"" + currentTrigger + "\" and its token \"" + actualToken + "\"\n\nSee https://github.com/webscopeio/react-textarea-autocomplete#trigger-type for more informations.\n");
                    }
                    if (typeof textToReplace === 'string') {
                        return {
                            text: textToReplace,
                            caretPosition: DEFAULT_CARET_POSITION,
                        };
                    }
                    if (!textToReplace.text) {
                        throw new Error("Output \"text\" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger \"" + currentTrigger + "\" and its token \"" + actualToken + "\"\n");
                    }
                    if (!textToReplace.caretPosition) {
                        throw new Error("Output \"caretPosition\" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger \"" + currentTrigger + "\" and its token \"" + actualToken + "\"\n");
                    }
                    return textToReplace;
                }
                if (typeof item !== 'string') {
                    throw new Error('Output item should be string\n');
                }
                return {
                    text: "" + currentTrigger + item + currentTrigger,
                    caretPosition: DEFAULT_CARET_POSITION,
                };
            };
        };
        _this._getCurrentTriggerSettings = function () {
            var currentTrigger = _this.state.currentTrigger;
            if (!currentTrigger)
                return null;
            return _this.props.trigger[currentTrigger];
        };
        _this._getValuesFromProvider = function () {
            var _a = _this.state, currentTrigger = _a.currentTrigger, actualToken = _a.actualToken;
            var triggerSettings = _this._getCurrentTriggerSettings();
            if (!currentTrigger || !triggerSettings) {
                return;
            }
            var dataProvider = triggerSettings.dataProvider, component = triggerSettings.component;
            if (typeof dataProvider !== 'function') {
                throw new Error('Trigger provider has to be a function!');
            }
            _this.setState({
                dataLoading: true,
            });
            // Modified: send the full text to support / style commands
            var providedData = dataProvider(actualToken, _this.state.value);
            if (!(providedData instanceof Promise)) {
                providedData = Promise.resolve(providedData);
            }
            providedData
                .then(function (data) {
                if (!Array.isArray(data)) {
                    throw new Error('Trigger provider has to provide an array!');
                }
                if (typeof component !== 'function') {
                    throw new Error('Component should be defined!');
                }
                // throw away if we resolved old trigger
                if (currentTrigger !== _this.state.currentTrigger)
                    return;
                // if we haven't resolved any data let's close the autocomplete
                if (!data.length) {
                    _this._closeAutocomplete();
                    return;
                }
                _this.setState({
                    dataLoading: false,
                    data: data,
                    component: component,
                });
            })
                .catch(function (e) { return errorMessage(e.message); });
        };
        _this._getSuggestions = function () {
            var _a = _this.state, currentTrigger = _a.currentTrigger, data = _a.data;
            if (!currentTrigger || !data || (data && !data.length))
                return null;
            return data;
        };
        _this._createRegExp = function () {
            var trigger = _this.props.trigger;
            // negative lookahead to match only the trigger + the actual token = "bladhwd:adawd:word test" => ":word"
            // https://stackoverflow.com/a/8057827/2719917
            _this.tokenRegExp = new RegExp("([" + Object.keys(trigger).join('') + "])(?:(?!\\1)[^\\s])*$");
        };
        /**
         * Close autocomplete, also clean up trigger (to avoid slow promises)
         */
        _this._closeAutocomplete = function () {
            _this.setState({
                data: null,
                dataLoading: false,
                currentTrigger: null,
                top: null,
                left: null,
            });
        };
        _this._cleanUpProps = function () {
            var props = __assign({}, _this.props);
            var notSafe = [
                'loadingComponent',
                'containerStyle',
                'minChar',
                'scrollToItem',
                'ref',
                'innerRef',
                'onChange',
                'onCaretPositionChange',
                'className',
                'value',
                'trigger',
                'listStyle',
                'itemStyle',
                'containerStyle',
                'loaderStyle',
                'className',
                'containerClassName',
                'listClassName',
                'itemClassName',
                'loaderClassName',
                'closeOnClickOutside',
                'dropdownStyle',
                'dropdownClassName',
                'movePopupAsYouType',
                'handleSubmit',
                'replaceWord',
                'grow',
                'additionalTextareaProps',
            ];
            // eslint-disable-next-line
            for (var prop in props) {
                if (notSafe.includes(prop))
                    delete props[prop];
            }
            return props;
        };
        _this._changeHandler = function (e) {
            var _a = _this.props, trigger = _a.trigger, onChange = _a.onChange, minChar = _a.minChar, onCaretPositionChange = _a.onCaretPositionChange, movePopupAsYouType = _a.movePopupAsYouType;
            var _b = _this.state, top = _b.top, left = _b.left;
            var textarea = e.target;
            var selectionEnd = textarea.selectionEnd, selectionStart = textarea.selectionStart;
            var value = textarea.value;
            if (onChange) {
                e.persist();
                onChange(e);
            }
            if (onCaretPositionChange) {
                var caretPosition = _this.getCaretPosition();
                onCaretPositionChange(caretPosition);
            }
            _this.setState({
                value: value,
            });
            var tokenMatch = _this.tokenRegExp.exec(value.slice(0, selectionEnd));
            var lastToken = tokenMatch && tokenMatch[0];
            var currentTrigger = (lastToken && Object.keys(trigger).find(function (a) { return a === lastToken[0]; })) ||
                null;
            /*
             if we lost the trigger token or there is no following character we want to close
             the autocomplete
            */
            if ((!lastToken || lastToken.length <= minChar) &&
                // check if our current trigger disallows whitespace
                ((_this.state.currentTrigger &&
                    !trigger[_this.state.currentTrigger].allowWhitespace) ||
                    !_this.state.currentTrigger)) {
                _this._closeAutocomplete();
                return;
            }
            /**
             * This code has to be sync that is the reason why we obtain the currentTrigger
             * from currentTrigger not this.state.currentTrigger
             *
             * Check if the currently typed token has to be afterWhitespace, or not.
             */
            if (currentTrigger &&
                value[tokenMatch.index - 1] &&
                trigger[currentTrigger].afterWhitespace &&
                !value[tokenMatch.index - 1].match(/\s/)) {
                _this._closeAutocomplete();
                return;
            }
            /**
              If our current trigger allows whitespace
              get the correct token for DataProvider, so we need to construct new RegExp
             */
            if (_this.state.currentTrigger &&
                trigger[_this.state.currentTrigger].allowWhitespace) {
                tokenMatch = new RegExp("\\" + _this.state.currentTrigger + "[^" + _this.state.currentTrigger + "]*$").exec(value.slice(0, selectionEnd));
                lastToken = tokenMatch && tokenMatch[0];
                if (!lastToken) {
                    _this._closeAutocomplete();
                    return;
                }
                currentTrigger =
                    Object.keys(trigger).find(function (a) { return a === lastToken[0]; }) || null;
            }
            var actualToken = lastToken.slice(1);
            // if trigger is not configured step out from the function, otherwise proceed
            if (!currentTrigger) {
                return;
            }
            if (movePopupAsYouType ||
                (top === null && left === null) ||
                // if we have single char - trigger it means we want to re-position the autocomplete
                lastToken.length === 1) {
                var _c = textarea_caret_1.default(textarea, selectionEnd), newTop = _c.top, newLeft = _c.left;
                _this.setState({
                    // make position relative to textarea
                    top: newTop - _this.textareaRef.scrollTop || 0,
                    left: newLeft,
                });
            }
            _this.setState({
                selectionEnd: selectionEnd,
                selectionStart: selectionStart,
                currentTrigger: currentTrigger,
                actualToken: actualToken,
            }, function () {
                try {
                    _this._getValuesFromProvider();
                }
                catch (err) {
                    errorMessage(err.message);
                }
            });
        };
        _this._selectHandler = function (e) {
            var _a = _this.props, onCaretPositionChange = _a.onCaretPositionChange, onSelect = _a.onSelect;
            if (onCaretPositionChange) {
                var caretPosition = _this.getCaretPosition();
                onCaretPositionChange(caretPosition);
            }
            if (onSelect) {
                e.persist();
                onSelect(e);
            }
        };
        _this._onClickAndBlurHandler = function (e) {
            var _a = _this.props, closeOnClickOutside = _a.closeOnClickOutside, onBlur = _a.onBlur;
            // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
            // that was actually clicked. If we clicked inside the autoselect dropdown, then
            // that's not a blur, from the autoselect's point of view, so then do nothing.
            var el = e.relatedTarget;
            if (_this.dropdownRef &&
                el instanceof Node &&
                _this.dropdownRef.contains(el)) {
                return;
            }
            if (closeOnClickOutside) {
                _this._closeAutocomplete();
            }
            if (onBlur) {
                e.persist();
                onBlur(e);
            }
        };
        _this._onScrollHandler = function () {
            _this._closeAutocomplete();
        };
        _this._dropdownScroll = function (item) {
            var scrollToItem = _this.props.scrollToItem;
            if (!scrollToItem)
                return;
            if (scrollToItem === true) {
                utils_1.defaultScrollToItem(_this.dropdownRef, item);
                return;
            }
            if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
                throw new Error('`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.');
            }
            scrollToItem(_this.dropdownRef, item);
        };
        var _a = _this.props, loadingComponent = _a.loadingComponent, trigger = _a.trigger, value = _a.value;
        // TODO: it would be better to have the parent control state...
        // if (value) this.state.value = value;
        _this._createRegExp();
        if (!loadingComponent) {
            throw new Error('RTA: loadingComponent is not defined');
        }
        if (!trigger) {
            throw new Error('RTA: trigger is not defined');
        }
        _this.state = {
            top: null,
            left: null,
            currentTrigger: null,
            actualToken: '',
            data: null,
            value: value || '',
            dataLoading: false,
            selectionEnd: 0,
            selectionStart: 0,
            component: null,
            listenerIndex: 0,
        };
        return _this;
    }
    ReactTextareaAutocomplete.prototype.componentDidMount = function () {
        var _this = this;
        listener_1.default.add(listener_1.KEY_CODES.ESC, function () { return _this._closeAutocomplete(); });
        listener_1.default.add(listener_1.KEY_CODES.SPACE, function () { return _this._onSpace(); });
        var listenerIndex = listener_1.default.add(listener_1.KEY_CODES.ENTER, function (e) {
            return _this._onEnter(e);
        });
        this.setState({
            listenerIndex: listenerIndex,
        });
        listener_1.default.startListen();
    };
    ReactTextareaAutocomplete.prototype.UNSAFE_componentWillReceiveProps = function (nextProps) {
        this._update(nextProps);
    };
    ReactTextareaAutocomplete.prototype.componentWillUnmount = function () {
        listener_1.default.stopListen();
        listener_1.default.remove(this.state.listenerIndex);
    };
    // TODO: This is an anti pattern in react, should come up with a better way
    ReactTextareaAutocomplete.prototype._update = function (_a) {
        var value = _a.value, trigger = _a.trigger;
        var oldValue = this.state.value;
        var oldTrigger = this.props.trigger;
        if (value !== oldValue || !oldValue)
            this.setState({ value: value });
        /**
         * check if trigger chars are changed, if so, change the regexp accordingly
         */
        if (Object.keys(trigger).join('') !== Object.keys(oldTrigger).join('')) {
            this._createRegExp();
        }
    };
    ReactTextareaAutocomplete.prototype.render = function () {
        var _this = this;
        var _a = this.props, Loader = _a.loadingComponent, style = _a.style, className = _a.className, itemStyle = _a.itemStyle, listClassName = _a.listClassName, itemClassName = _a.itemClassName, dropdownClassName = _a.dropdownClassName, dropdownStyle = _a.dropdownStyle, containerStyle = _a.containerStyle, containerClassName = _a.containerClassName, loaderStyle = _a.loaderStyle, loaderClassName = _a.loaderClassName;
        var _b = this.state, dataLoading = _b.dataLoading, currentTrigger = _b.currentTrigger, component = _b.component, value = _b.value;
        var suggestionData = this._getSuggestions();
        var textToReplace = this._getTextToReplace();
        var selectedItem = this._getItemOnSelect();
        var maxRows = this.props.maxRows;
        if (!this.props.grow) {
            maxRows = 1;
        }
        return (react_1.default.createElement("div", { className: "rta " + (dataLoading === true ? 'rta--loading' : '') + " " + (containerClassName || ''), style: containerStyle },
            (dataLoading || suggestionData) && currentTrigger && (react_1.default.createElement("div", { ref: function (ref) {
                    // $FlowFixMe
                    _this.dropdownRef = ref;
                }, style: __assign({}, dropdownStyle), className: "rta__autocomplete " + (dropdownClassName || '') },
                suggestionData && component && textToReplace && (react_1.default.createElement(List_1.default, { value: value, values: suggestionData, component: component, className: listClassName, itemClassName: itemClassName, itemStyle: itemStyle, getTextToReplace: textToReplace, getSelectedItem: selectedItem, onSelect: this._onSelect, dropdownScroll: this._dropdownScroll })),
                dataLoading && (react_1.default.createElement("div", { className: "rta__loader " + (suggestionData !== null
                        ? 'rta__loader--suggestion-data'
                        : 'rta__loader--empty-suggestion-data') + " " + (loaderClassName || ''), style: loaderStyle },
                    react_1.default.createElement(Loader, { data: suggestionData }))))),
            react_1.default.createElement(react_textarea_autosize_1.default, __assign({}, this._cleanUpProps(), { inputRef: function (ref) {
                    _this.props.innerRef && _this.props.innerRef(ref);
                    _this.textareaRef = ref;
                }, maxRows: maxRows, className: "rta__textarea " + (className || ''), onChange: this._changeHandler, onSelect: this._selectHandler, onScroll: this._onScrollHandler, onClick: 
                // The textarea itself is outside the autoselect dropdown.
                this._onClickAndBlurHandler, onBlur: this._onClickAndBlurHandler, onFocus: this.props.onFocus, value: value, style: style }, this.props.additionalTextareaProps))));
    };
    ReactTextareaAutocomplete.defaultProps = {
        closeOnClickOutside: true,
        movePopupAsYouType: false,
        value: '',
        minChar: 1,
        scrollToItem: true,
        maxRows: 10,
    };
    return ReactTextareaAutocomplete;
}(react_1.default.Component));
var triggerPropsCheck = function (_a) {
    var trigger = _a.trigger;
    if (!trigger)
        return Error('Invalid prop trigger. Prop missing.');
    var triggers = Object.entries(trigger);
    for (var i = 0; i < triggers.length; i += 1) {
        var _b = triggers[i], triggerChar = _b[0], settings = _b[1];
        if (typeof triggerChar !== 'string' || triggerChar.length !== 1) {
            return Error('Invalid prop trigger. Keys of the object has to be string / one character.');
        }
        // $FlowFixMe
        var triggerSetting = settings;
        var component = triggerSetting.component, dataProvider = triggerSetting.dataProvider, output = triggerSetting.output, callback = triggerSetting.callback, afterWhitespace = triggerSetting.afterWhitespace, allowWhitespace = triggerSetting.allowWhitespace;
        if (!component || typeof component !== 'function') {
            return Error('Invalid prop trigger: component should be defined.');
        }
        if (!dataProvider || typeof dataProvider !== 'function') {
            return Error('Invalid prop trigger: dataProvider should be defined.');
        }
        if (output && typeof output !== 'function') {
            return Error('Invalid prop trigger: output should be a function.');
        }
        if (callback && typeof callback !== 'function') {
            return Error('Invalid prop trigger: callback should be a function.');
        }
        if (afterWhitespace && allowWhitespace) {
            return Error('Invalid prop trigger: afterWhitespace and allowWhitespace can be used together');
        }
    }
    return null;
};
ReactTextareaAutocomplete.propTypes = {
    loadingComponent: prop_types_1.default.func.isRequired,
    minChar: prop_types_1.default.number,
    onChange: prop_types_1.default.func,
    onSelect: prop_types_1.default.func,
    onBlur: prop_types_1.default.func,
    onCaretPositionChange: prop_types_1.default.func,
    className: prop_types_1.default.string,
    containerStyle: prop_types_1.default.object,
    containerClassName: prop_types_1.default.string,
    closeOnClickOutside: prop_types_1.default.bool,
    style: prop_types_1.default.object,
    listStyle: prop_types_1.default.object,
    itemStyle: prop_types_1.default.object,
    loaderStyle: prop_types_1.default.object,
    dropdownStyle: prop_types_1.default.object,
    listClassName: prop_types_1.default.string,
    itemClassName: prop_types_1.default.string,
    loaderClassName: prop_types_1.default.string,
    dropdownClassName: prop_types_1.default.string,
    value: prop_types_1.default.string,
    trigger: triggerPropsCheck,
};
exports.default = ReactTextareaAutocomplete;
