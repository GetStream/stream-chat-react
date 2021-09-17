import React from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';
import getCaretCoordinates from 'textarea-caret';
import CustomEvent from 'custom-event';
import { isValidElementType } from 'react-is';

import Listeners, { KEY_CODES } from './listener';
import { List as DefaultSuggestionList } from './List';
import {
  DEFAULT_CARET_POSITION,
  defaultScrollToItem,
  errorMessage,
  triggerPropsCheck,
} from './utils';

import { CommandItem } from '../CommandItem/CommandItem';

export class ReactTextareaAutocomplete extends React.Component {
  static defaultProps = {
    closeOnClickOutside: true,
    maxRows: 10,
    minChar: 1,
    movePopupAsYouType: false,
    scrollToItem: true,
    value: '',
  };

  constructor(props) {
    super(props);

    const { loadingComponent, trigger, value } = this.props;

    // TODO: it would be better to have the parent control state...
    // if (value) this.state.value = value;

    this._createRegExp();

    if (!loadingComponent) {
      throw new Error('RTA: loadingComponent is not defined');
    }

    if (!trigger) {
      throw new Error('RTA: trigger is not defined');
    }
    this.state = {
      actualToken: '',
      component: null,
      currentTrigger: null,
      data: null,
      dataLoading: false,
      keycodeSubmitShiftE: false,
      left: null,
      listenerIndex: {},
      selectionEnd: 0,
      selectionStart: 0,
      top: null,
      value: value || '',
    };
  }

  componentDidMount() {
    Listeners.add(KEY_CODES.ESC, () => this._closeAutocomplete());
    Listeners.add(KEY_CODES.SPACE, () => this._onSpace());

    const listenerIndex = {};
    const newSubmitKeys = this.props.keycodeSubmitKeys;

    if (newSubmitKeys) {
      const keycodeIndex = this.addKeycodeSubmitListeners(newSubmitKeys);
      listenerIndex[keycodeIndex] = keycodeIndex;
    } else {
      const enterIndex = Listeners.add(KEY_CODES.ENTER, (e) => this._onEnter(e));
      listenerIndex[enterIndex] = enterIndex;
    }

    this.setState({
      listenerIndex,
    });

    Listeners.startListen();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this._update(nextProps);
  }

  componentWillUnmount() {
    Listeners.stopListen();
    Listeners.remove(this.state.listenerIndex);
  }

  getSelectionPosition = () => {
    if (!this.textareaRef) return null;

    return {
      selectionEnd: this.textareaRef.selectionEnd,
      selectionStart: this.textareaRef.selectionStart,
    };
  };

  getSelectedText = () => {
    if (!this.textareaRef) return null;
    const { selectionEnd, selectionStart } = this.textareaRef;

    if (selectionStart === selectionEnd) return null;

    return this.state.value.substr(selectionStart, selectionEnd - selectionStart);
  };

  setCaretPosition = (position = 0) => {
    if (!this.textareaRef) return;

    this.textareaRef.focus();
    this.textareaRef.setSelectionRange(position, position);
  };

  getCaretPosition = () => {
    if (!this.textareaRef) return 0;

    return this.textareaRef.selectionEnd;
  };

  addKeycodeSubmitListeners = (keyCodes) => {
    keyCodes.forEach((arrayOfCodes) => {
      let submitValue = arrayOfCodes;
      if (submitValue.length === 1) {
        submitValue = submitValue[0];
      }

      // does submitted keycodes include shift+Enter?
      const shiftE = arrayOfCodes.every((code) => [16, 13].includes(code));
      if (shiftE) this.keycodeSubmitShiftE = true;

      return Listeners.add(submitValue, (e) => this._onEnter(e));
    });
  };

  _onEnter = (event) => {
    if (!this.textareaRef) return;

    const trigger = this.state.currentTrigger;
    const hasFocus = this.textareaRef.matches(':focus');

    // Don't submit if the element doesn't have focus or the shift key is pressed, unless shift+Enter were provided as submit keys
    if (
      !hasFocus ||
      (event.shiftKey === true && !this.keycodeSubmitShiftE) ||
      (event.shiftKey === true && !this.props.keycodeSubmitKeys)
    ) {
      return;
    }

    if (!trigger || !this.state.data) {
      // trigger a submit
      this._replaceWord();
      if (this.textareaRef) {
        this.textareaRef.selectionEnd = 0;
      }
      this.props.handleSubmit(event);
      this._closeAutocomplete();
    }
  };

  _onSpace = () => {
    if (!this.props.replaceWord || !this.textareaRef) return;

    // don't change characters if the element doesn't have focus
    const hasFocus = this.textareaRef.matches(':focus');
    if (!hasFocus) return;

    this._replaceWord();
  };

  _replaceWord = () => {
    const { value } = this.state;

    const lastWordRegex = /([^\s]+)(\s*)$/;
    const match = lastWordRegex.exec(value.slice(0, this.getCaretPosition()));
    const lastWord = match && match[1];

    if (!lastWord) return;

    const spaces = match[2];

    const newWord = this.props.replaceWord(lastWord);
    if (newWord == null) return;

    const textBeforeWord = value.slice(0, this.getCaretPosition() - match[0].length);
    const textAfterCaret = value.slice(this.getCaretPosition(), -1);
    const newText = textBeforeWord + newWord + spaces + textAfterCaret;

    this.setState(
      {
        value: newText,
      },
      () => {
        // fire onChange event after successful selection
        const e = new CustomEvent('change', { bubbles: true });
        this.textareaRef.dispatchEvent(e);
        if (this.props.onChange) this.props.onChange(e);
      },
    );
  };

  _onSelect = (newToken) => {
    const { closeCommandsList, onChange, showCommandsList } = this.props;
    const { currentTrigger: stateTrigger, selectionEnd, value: textareaValue } = this.state;

    const currentTrigger = showCommandsList ? '/' : stateTrigger;

    if (!currentTrigger) return;

    const computeCaretPosition = (position, token, startToken) => {
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

    const textToModify = showCommandsList ? '/' : textareaValue.slice(0, selectionEnd);

    const startOfTokenPosition = textToModify.lastIndexOf(currentTrigger);

    // we add space after emoji is selected if a caret position is next
    const newTokenString = newToken.caretPosition === 'next' ? `${newToken.text} ` : newToken.text;

    const newCaretPosition = computeCaretPosition(
      newToken.caretPosition,
      newTokenString,
      startOfTokenPosition,
    );

    const modifiedText = textToModify.substring(0, startOfTokenPosition) + newTokenString;
    const valueToReplace = textareaValue.replace(textToModify, modifiedText);

    // set the new textarea value and after that set the caret back to its position
    this.setState(
      {
        dataLoading: false,
        value: valueToReplace,
      },
      () => {
        // fire onChange event after successful selection
        const e = new CustomEvent('change', { bubbles: true });
        this.textareaRef.dispatchEvent(e);
        if (onChange) onChange(e);

        this.setCaretPosition(newCaretPosition);
      },
    );
    this._closeAutocomplete();
    closeCommandsList();
  };

  _getItemOnSelect = (paramTrigger) => {
    const { currentTrigger: stateTrigger } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings(paramTrigger);

    const currentTrigger = paramTrigger || stateTrigger;

    if (!currentTrigger || !triggerSettings) return null;

    const { callback } = triggerSettings;

    if (!callback) return null;

    return (item) => {
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
  };

  _getTextToReplace = (paramTrigger) => {
    const { actualToken, currentTrigger: stateTrigger } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings(paramTrigger);

    const currentTrigger = paramTrigger || stateTrigger;

    if (!currentTrigger || !triggerSettings) return null;

    const { output } = triggerSettings;

    return (item) => {
      if (typeof item === 'object' && (!output || typeof output !== 'function')) {
        throw new Error(
          'Output functor is not defined! If you are using items as object you have to define "output" function. https://github.com/webscopeio/react-textarea-autocomplete#trigger-type',
        );
      }

      if (output) {
        const textToReplace = output(item, currentTrigger);

        if (!textToReplace || typeof textToReplace === 'number') {
          throw new Error(
            `Output functor should return string or object in shape {text: string, caretPosition: string | number}.\nGot "${String(
              textToReplace,
            )}". Check the implementation for trigger "${currentTrigger}" and its token "${actualToken}"\n\nSee https://github.com/webscopeio/react-textarea-autocomplete#trigger-type for more informations.\n`,
          );
        }

        if (typeof textToReplace === 'string') {
          return {
            caretPosition: DEFAULT_CARET_POSITION,
            text: textToReplace,
          };
        }

        if (!textToReplace.text && currentTrigger !== ':') {
          throw new Error(
            `Output "text" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "${currentTrigger}" and its token "${actualToken}"\n`,
          );
        }

        if (!textToReplace.caretPosition) {
          throw new Error(
            `Output "caretPosition" is not defined! Object should has shape {text: string, caretPosition: string | number}. Check the implementation for trigger "${currentTrigger}" and its token "${actualToken}"\n`,
          );
        }

        return textToReplace;
      }

      if (typeof item !== 'string') {
        throw new Error('Output item should be string\n');
      }

      return {
        caretPosition: DEFAULT_CARET_POSITION,
        text: `${currentTrigger}${item}${currentTrigger}`,
      };
    };
  };

  _getCurrentTriggerSettings = (paramTrigger) => {
    const { currentTrigger: stateTrigger } = this.state;

    const currentTrigger = paramTrigger || stateTrigger;

    if (!currentTrigger) return null;

    return this.props.trigger[currentTrigger];
  };

  _getValuesFromProvider = () => {
    const { actualToken, currentTrigger } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();

    if (!currentTrigger || !triggerSettings) return;

    const { component, dataProvider } = triggerSettings;

    if (typeof dataProvider !== 'function') {
      throw new Error('Trigger provider has to be a function!');
    }

    this.setState({ dataLoading: true });

    // Modified: send the full text to support / style commands
    dataProvider(actualToken, this.state.value, (data, token) => {
      // Make sure that the result is still relevant for current query
      if (token !== this.state.actualToken) return;

      if (!Array.isArray(data)) {
        throw new Error('Trigger provider has to provide an array!');
      }

      if (!isValidElementType(component)) {
        throw new Error('Component should be defined!');
      }

      // throw away if we resolved old trigger
      if (currentTrigger !== this.state.currentTrigger) return;

      // if we haven't resolved any data let's close the autocomplete
      if (!data.length) {
        this._closeAutocomplete();
        return;
      }

      this.setState({
        component,
        data,
        dataLoading: false,
      });
    });
  };

  _getSuggestions = (paramTrigger) => {
    const { currentTrigger: stateTrigger, data } = this.state;

    const currentTrigger = paramTrigger || stateTrigger;

    if (!currentTrigger || !data || (data && !data.length)) return null;

    return data;
  };

  _createRegExp = () => {
    const { trigger } = this.props;

    // negative lookahead to match only the trigger + the actual token = "bladhwd:adawd:word test" => ":word"
    // https://stackoverflow.com/a/8057827/2719917
    this.tokenRegExp = new RegExp(`([${Object.keys(trigger).join('')}])(?:(?!\\1)[^\\s])*$`);
  };

  // TODO: This is an anti pattern in react, should come up with a better way
  _update({ trigger, value }) {
    const { value: oldValue } = this.state;
    const { trigger: oldTrigger } = this.props;

    if (value !== oldValue || !oldValue) this.setState({ value });
    /**
     * check if trigger chars are changed, if so, change the regexp accordingly
     */
    if (Object.keys(trigger).join('') !== Object.keys(oldTrigger).join('')) {
      this._createRegExp();
    }
  }

  /**
   * Close autocomplete, also clean up trigger (to avoid slow promises)
   */
  _closeAutocomplete = () => {
    this.setState({
      currentTrigger: null,
      data: null,
      dataLoading: false,
      left: null,
      top: null,
    });
  };

  _cleanUpProps = () => {
    const props = { ...this.props };
    const notSafe = [
      'additionalTextareaProps',
      'className',
      'closeCommandsList',
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
      'showCommandsList',
      'SuggestionItem',
      'SuggestionList',
      'trigger',
      'value',
    ];

    // eslint-disable-next-line
    for (const prop in props) {
      if (notSafe.includes(prop)) delete props[prop];
    }

    return props;
  };

  _isCommand = (text) => {
    if (text[0] !== '/') return false;

    const tokens = text.split(' ');

    if (tokens.length > 1) return false;

    return true;
  };

  _changeHandler = (e) => {
    const { minChar, movePopupAsYouType, onCaretPositionChange, onChange, trigger } = this.props;
    const { left, top } = this.state;

    const textarea = e.target;
    const { selectionEnd, selectionStart, value } = textarea;

    if (onChange) {
      e.persist();
      onChange(e);
    }

    if (onCaretPositionChange) onCaretPositionChange(this.getCaretPosition());

    this.setState({ value });

    let currentTrigger;
    let lastToken;

    if (this._isCommand(value)) {
      currentTrigger = '/';
      lastToken = value;
    } else {
      const triggerTokens = Object.keys(trigger).join().replace('/', '');
      const triggerNorWhitespace = `[^\\s${triggerTokens}]*`;
      const regex = new RegExp(
        `(?!^|\\W)?[${triggerTokens}]${triggerNorWhitespace}\\s?${triggerNorWhitespace}$`,
        'g',
      );
      const tokenMatch = value.slice(0, selectionEnd).match(regex);

      lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();

      currentTrigger = (lastToken && Object.keys(trigger).find((a) => a === lastToken[0])) || null;
    }

    /*
     if we lost the trigger token or there is no following character we want to close
     the autocomplete
    */
    if (!lastToken || lastToken.length <= minChar) {
      this._closeAutocomplete();
      return;
    }

    const actualToken = lastToken.slice(1);

    // if trigger is not configured step out from the function, otherwise proceed
    if (!currentTrigger) return;

    if (
      movePopupAsYouType ||
      (top === null && left === null) ||
      // if we have single char - trigger it means we want to re-position the autocomplete
      lastToken.length === 1
    ) {
      const { left: newLeft, top: newTop } = getCaretCoordinates(textarea, selectionEnd);

      this.setState({
        // make position relative to textarea
        left: newLeft,
        top: newTop - this.textareaRef.scrollTop || 0,
      });
    }
    this.setState(
      {
        actualToken,
        currentTrigger,
        selectionEnd,
        selectionStart,
      },
      () => {
        try {
          this._getValuesFromProvider();
        } catch (err) {
          errorMessage(err.message);
        }
      },
    );
  };

  _selectHandler = (e) => {
    const { onCaretPositionChange, onSelect } = this.props;

    if (onCaretPositionChange) onCaretPositionChange(this.getCaretPosition());

    if (onSelect) {
      e.persist();
      onSelect(e);
    }
  };

  // The textarea itself is outside the auto-select dropdown.
  _onClickAndBlurHandler = (e) => {
    const { closeOnClickOutside, onBlur } = this.props;

    // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
    // that was actually clicked. If we clicked inside the auto-select dropdown, then
    // that's not a blur, from the auto-select point of view, so then do nothing.
    const el = e.relatedTarget;
    if (this.dropdownRef && el instanceof Node && this.dropdownRef.contains(el)) {
      return;
    }

    if (closeOnClickOutside) this._closeAutocomplete();

    if (onBlur) {
      e.persist();
      onBlur(e);
    }
  };

  _onScrollHandler = () => this._closeAutocomplete();

  _dropdownScroll = (item) => {
    const { scrollToItem } = this.props;

    if (!scrollToItem) return;

    if (scrollToItem === true) {
      defaultScrollToItem(this.dropdownRef, item);
      return;
    }

    if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
      throw new Error(
        '`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.',
      );
    }

    scrollToItem(this.dropdownRef, item);
  };

  getTriggerProps = () => {
    const { showCommandsList, trigger } = this.props;
    const { component, currentTrigger, selectionEnd, value } = this.state;

    const selectedItem = this._getItemOnSelect();
    const suggestionData = this._getSuggestions();
    const textToReplace = this._getTextToReplace();

    const triggerProps = {
      component,
      currentTrigger,
      getSelectedItem: selectedItem,
      getTextToReplace: textToReplace,
      selectionEnd,
      value,
      values: suggestionData,
    };

    if (showCommandsList && trigger['/']) {
      let currentCommands;
      const getCommands = trigger['/'].dataProvider;

      getCommands?.('', '/', (data) => {
        currentCommands = data;
      });

      triggerProps.component = CommandItem;
      triggerProps.currentTrigger = '/';
      triggerProps.getTextToReplace = this._getTextToReplace('/');
      triggerProps.getSelectedItem = this._getItemOnSelect('/');
      triggerProps.selectionEnd = 1;
      triggerProps.value = '/';
      triggerProps.values = currentCommands;
    }

    return triggerProps;
  };

  renderSuggestionListContainer() {
    const {
      disableMentions,
      dropdownClassName,
      dropdownStyle,
      itemClassName,
      itemStyle,
      listClassName,
      SuggestionItem,
      SuggestionList = DefaultSuggestionList,
    } = this.props;

    const triggerProps = this.getTriggerProps();

    if (
      triggerProps.values &&
      triggerProps.currentTrigger &&
      !(disableMentions && triggerProps.currentTrigger === '@')
    ) {
      return (
        <div
          className={`rta__autocomplete ${dropdownClassName || ''}`}
          ref={(ref) => {
            this.dropdownRef = ref;
          }}
          style={dropdownStyle}
        >
          <SuggestionList
            className={listClassName}
            dropdownScroll={this._dropdownScroll}
            itemClassName={itemClassName}
            itemStyle={itemStyle}
            onSelect={this._onSelect}
            SuggestionItem={SuggestionItem}
            {...triggerProps}
          />
        </div>
      );
    }

    return null;
  }

  render() {
    const { className, containerClassName, containerStyle, style } = this.props;

    let { maxRows } = this.props;

    const { dataLoading, value } = this.state;

    if (!this.props.grow) maxRows = 1;

    return (
      <div
        className={`rta ${dataLoading === true ? 'rta--loading' : ''} ${containerClassName || ''}`}
        style={containerStyle}
      >
        {this.renderSuggestionListContainer()}
        <Textarea
          {...this._cleanUpProps()}
          className={`rta__textarea ${className || ''}`}
          maxRows={maxRows}
          onBlur={this._onClickAndBlurHandler}
          onChange={this._changeHandler}
          onClick={this._onClickAndBlurHandler}
          onFocus={this.props.onFocus}
          onScroll={this._onScrollHandler}
          onSelect={this._selectHandler}
          ref={(ref) => {
            if (this.props.innerRef) this.props.innerRef(ref);
            this.textareaRef = ref;
          }}
          style={style}
          value={value}
          {...this.props.additionalTextareaProps}
        />
      </div>
    );
  }
}

ReactTextareaAutocomplete.propTypes = {
  className: PropTypes.string,
  closeOnClickOutside: PropTypes.bool,
  containerClassName: PropTypes.string,
  containerStyle: PropTypes.object,
  disableMentions: PropTypes.bool,
  dropdownClassName: PropTypes.string,
  dropdownStyle: PropTypes.object,
  itemClassName: PropTypes.string,
  itemStyle: PropTypes.object,
  keycodeSubmitKeys: PropTypes.array,
  listClassName: PropTypes.string,
  listStyle: PropTypes.object,
  loaderClassName: PropTypes.string,
  loaderStyle: PropTypes.object,
  loadingComponent: PropTypes.elementType,
  minChar: PropTypes.number,
  onBlur: PropTypes.func,
  onCaretPositionChange: PropTypes.func,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  style: PropTypes.object,
  SuggestionList: PropTypes.elementType,
  trigger: triggerPropsCheck,
  value: PropTypes.string,
};
