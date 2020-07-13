/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';
import getCaretCoordinates from 'textarea-caret';
import CustomEvent from 'custom-event';
import { isValidElementType } from 'react-is';

import Listeners, { KEY_CODES } from './listener';
import List from './List';

import { defaultScrollToItem } from './utils';

import Textarea from 'react-textarea-autosize';

const DEFAULT_CARET_POSITION = 'next';

const errorMessage = (message) =>
  console.error(
    `RTA: dataProvider fails: ${message}
    \nCheck the documentation or create issue if you think it's bug. https://github.com/webscopeio/react-textarea-autocomplete/issues`,
  );

class ReactTextareaAutocomplete extends React.Component {
  static defaultProps = {
    closeOnClickOutside: true,
    movePopupAsYouType: false,
    value: '',
    minChar: 1,
    scrollToItem: true,
    maxRows: 10,
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
  }

  componentDidMount() {
    Listeners.add(KEY_CODES.ESC, () => this._closeAutocomplete());
    Listeners.add(KEY_CODES.SPACE, () => this._onSpace());
    const listenerIndex = Listeners.add(KEY_CODES.ENTER, (e) =>
      this._onEnter(e),
    );
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
      selectionStart: this.textareaRef.selectionStart,
      selectionEnd: this.textareaRef.selectionEnd,
    };
  };

  getSelectedText = () => {
    if (!this.textareaRef) return null;
    const { selectionStart, selectionEnd } = this.textareaRef;

    if (selectionStart === selectionEnd) return null;

    return this.state.value.substr(
      selectionStart,
      selectionEnd - selectionStart,
    );
  };

  setCaretPosition = (position = 0) => {
    if (!this.textareaRef) return;

    this.textareaRef.focus();
    this.textareaRef.setSelectionRange(position, position);
  };

  getCaretPosition = () => {
    if (!this.textareaRef) {
      return 0;
    }

    return this.textareaRef.selectionEnd;
  };

  // handle the on-enter behaviour
  _onEnter = (event) => {
    const trigger = this.state.currentTrigger;
    if (!this.textareaRef) {
      return;
    }

    const hasFocus = this.textareaRef.matches(':focus');

    // don't submit if the element has focus or the shift key is pressed
    if (!hasFocus || event.shiftKey === true) {
      return;
    }
    if (!trigger || !this.state.data) {
      // trigger a submit
      this._replaceWord();
      if (this.textareaRef) {
        this.textareaRef.selectionEnd = 0;
      }
      this.props.handleSubmit(event);
    }
  };

  // handle the on-space behaviour
  _onSpace = () => {
    if (!this.props.replaceWord) {
      return;
    }

    if (!this.textareaRef) {
      return;
    }
    const hasFocus = this.textareaRef.matches(':focus');

    // don't change characters if the element doesn't have focus
    if (!hasFocus) {
      return;
    }
    this._replaceWord();
  };

  _replaceWord = () => {
    const lastWordRegex = /([^\s]+)(\s*)$/;
    const { value } = this.state;
    const match = lastWordRegex.exec(value.slice(0, this.getCaretPosition()));
    const lastWord = match && match[1];
    if (!lastWord) {
      return;
    }
    const spaces = match[2];

    const newWord = this.props.replaceWord(lastWord);
    if (newWord == null) {
      return;
    }
    const textBeforeWord = value.slice(
      0,
      this.getCaretPosition() - match[0].length,
    );
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
    const { selectionEnd, currentTrigger, value: textareaValue } = this.state;
    const { onChange, trigger } = this.props;

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
            throw new Error(
              'RTA: caretPosition should be "start", "next", "end" or number.',
            );
          }

          return position;
      }
    };

    const textToModify = textareaValue.slice(0, selectionEnd);

    const startOfTokenPosition = textToModify.search(
      /**
       * It's important to escape the currentTrigger char for chars like [, (,...
       */
      new RegExp(`\\${currentTrigger}${`[^\\${currentTrigger}${'\\s'}]`}*$`),
    );

    // we add space after emoji is selected if a caret position is next
    const newTokenString =
      newToken.caretPosition === 'next' ? `${newToken.text} ` : newToken.text;

    const newCaretPosition = computeCaretPosition(
      newToken.caretPosition,
      newTokenString,
      startOfTokenPosition,
    );

    const modifiedText =
      textToModify.substring(0, startOfTokenPosition) + newTokenString;

    // set the new textarea value and after that set the caret back to its position
    this.setState(
      {
        value: textareaValue.replace(textToModify, modifiedText),
        dataLoading: false,
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
  };

  _getItemOnSelect = () => {
    const { currentTrigger } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();

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

  _getTextToReplace = () => {
    const { currentTrigger, actualToken } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();

    if (!currentTrigger || !triggerSettings) return null;

    const { output } = triggerSettings;

    return (item) => {
      if (
        typeof item === 'object' &&
        (!output || typeof output !== 'function')
      ) {
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
            text: textToReplace,
            caretPosition: DEFAULT_CARET_POSITION,
          };
        }

        if (!textToReplace.text) {
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
        text: `${currentTrigger}${item}${currentTrigger}`,
        caretPosition: DEFAULT_CARET_POSITION,
      };
    };
  };

  _getCurrentTriggerSettings = () => {
    const { currentTrigger } = this.state;

    if (!currentTrigger) return null;

    return this.props.trigger[currentTrigger];
  };

  _getValuesFromProvider = () => {
    const { currentTrigger, actualToken } = this.state;
    const triggerSettings = this._getCurrentTriggerSettings();
    if (!currentTrigger || !triggerSettings) {
      return;
    }

    const { dataProvider, component } = triggerSettings;

    if (typeof dataProvider !== 'function') {
      throw new Error('Trigger provider has to be a function!');
    }

    this.setState({
      dataLoading: true,
    });

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
        dataLoading: false,
        data,
        component,
      });
    });
  };

  _getSuggestions = () => {
    const { currentTrigger, data } = this.state;

    if (!currentTrigger || !data || (data && !data.length)) return null;

    return data;
  };

  _createRegExp = () => {
    const { trigger } = this.props;

    // negative lookahead to match only the trigger + the actual token = "bladhwd:adawd:word test" => ":word"
    // https://stackoverflow.com/a/8057827/2719917
    this.tokenRegExp = new RegExp(
      `([${Object.keys(trigger).join('')}])(?:(?!\\1)[^\\s])*$`,
    );
  };

  // TODO: This is an anti pattern in react, should come up with a better way
  _update({ value, trigger }) {
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
      data: null,
      dataLoading: false,
      currentTrigger: null,
      top: null,
      left: null,
    });
  };

  _cleanUpProps = () => {
    const props = { ...this.props };
    const notSafe = [
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
    const {
      trigger,
      onChange,
      minChar,
      onCaretPositionChange,
      movePopupAsYouType,
    } = this.props;
    const { top, left } = this.state;

    const textarea = e.target;
    const { selectionEnd, selectionStart } = textarea;
    const value = textarea.value;

    if (onChange) {
      e.persist();
      onChange(e);
    }

    if (onCaretPositionChange) {
      const caretPosition = this.getCaretPosition();
      onCaretPositionChange(caretPosition);
    }

    this.setState({
      value,
    });

    let currentTrigger;
    let lastToken;

    if (this._isCommand(value)) {
      currentTrigger = '/';
      lastToken = value;
    } else {
      let tokenMatch = value
        .slice(0, selectionEnd)
        .match(/(?!^|\W)?[:@][^\s]*\s?[^\s]*$/g);

      lastToken = tokenMatch && tokenMatch[tokenMatch.length - 1].trim();

      currentTrigger =
        (lastToken && Object.keys(trigger).find((a) => a === lastToken[0])) ||
        null;
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
    if (!currentTrigger) {
      return;
    }

    if (
      movePopupAsYouType ||
      (top === null && left === null) ||
      // if we have single char - trigger it means we want to re-position the autocomplete
      lastToken.length === 1
    ) {
      const { top: newTop, left: newLeft } = getCaretCoordinates(
        textarea,
        selectionEnd,
      );

      this.setState({
        // make position relative to textarea
        top: newTop - this.textareaRef.scrollTop || 0,
        left: newLeft,
      });
    }

    this.setState(
      {
        selectionEnd,
        selectionStart,
        currentTrigger,
        actualToken,
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

    if (onCaretPositionChange) {
      const caretPosition = this.getCaretPosition();
      onCaretPositionChange(caretPosition);
    }

    if (onSelect) {
      e.persist();
      onSelect(e);
    }
  };

  _onClickAndBlurHandler = (e) => {
    const { closeOnClickOutside, onBlur } = this.props;

    // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
    // that was actually clicked. If we clicked inside the autoselect dropdown, then
    // that's not a blur, from the autoselect's point of view, so then do nothing.
    const el = e.relatedTarget;
    if (
      this.dropdownRef &&
      el instanceof Node &&
      this.dropdownRef.contains(el)
    ) {
      return;
    }

    if (closeOnClickOutside) {
      this._closeAutocomplete();
    }

    if (onBlur) {
      e.persist();
      onBlur(e);
    }
  };

  _onScrollHandler = () => {
    this._closeAutocomplete();
  };

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

  render() {
    const {
      loadingComponent: Loader,
      style,
      className,
      itemStyle,
      listClassName,
      itemClassName,
      dropdownClassName,
      dropdownStyle,
      containerStyle,
      containerClassName,
      loaderStyle,
      loaderClassName,
    } = this.props;
    const { dataLoading, currentTrigger, component, value } = this.state;

    const suggestionData = this._getSuggestions();
    const textToReplace = this._getTextToReplace();
    const selectedItem = this._getItemOnSelect();

    let maxRows = this.props.maxRows;
    if (!this.props.grow) {
      maxRows = 1;
    }

    return (
      <div
        className={`rta ${dataLoading === true ? 'rta--loading' : ''} ${
          containerClassName || ''
        }`}
        style={containerStyle}
      >
        {(dataLoading || suggestionData) && currentTrigger && (
          <div
            ref={(ref) => {
              // $FlowFixMe
              this.dropdownRef = ref;
            }}
            style={{ ...dropdownStyle }}
            className={`rta__autocomplete ${dropdownClassName || ''}`}
          >
            {suggestionData && component && textToReplace && (
              <List
                value={value}
                values={suggestionData}
                component={component}
                className={listClassName}
                itemClassName={itemClassName}
                itemStyle={itemStyle}
                getTextToReplace={textToReplace}
                getSelectedItem={selectedItem}
                onSelect={this._onSelect}
                dropdownScroll={this._dropdownScroll}
              />
            )}
          </div>
        )}

        <Textarea
          {...this._cleanUpProps()}
          ref={(ref) => {
            this.props.innerRef && this.props.innerRef(ref);
            this.textareaRef = ref;
          }}
          maxRows={maxRows}
          className={`rta__textarea ${className || ''}`}
          onChange={this._changeHandler}
          onSelect={this._selectHandler}
          onScroll={this._onScrollHandler}
          onClick={
            // The textarea itself is outside the autoselect dropdown.
            this._onClickAndBlurHandler
          }
          onBlur={this._onClickAndBlurHandler}
          onFocus={this.props.onFocus}
          value={value}
          style={style}
          {...this.props.additionalTextareaProps}
        />
      </div>
    );
  }
}

const triggerPropsCheck = ({ trigger }) => {
  if (!trigger) return Error('Invalid prop trigger. Prop missing.');

  const triggers = Object.entries(trigger);

  for (let i = 0; i < triggers.length; i += 1) {
    const [triggerChar, settings] = triggers[i];

    if (typeof triggerChar !== 'string' || triggerChar.length !== 1) {
      return Error(
        'Invalid prop trigger. Keys of the object has to be string / one character.',
      );
    }

    // $FlowFixMe
    const triggerSetting = settings;

    const { component, dataProvider, output, callback } = triggerSetting;

    if (!isValidElementType(component)) {
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
  }

  return null;
};

ReactTextareaAutocomplete.propTypes = {
  loadingComponent: PropTypes.elementType,
  minChar: PropTypes.number,
  onChange: PropTypes.func,
  onSelect: PropTypes.func,
  onBlur: PropTypes.func,
  onCaretPositionChange: PropTypes.func,
  className: PropTypes.string,
  containerStyle: PropTypes.object,
  containerClassName: PropTypes.string,
  closeOnClickOutside: PropTypes.bool,
  style: PropTypes.object,
  listStyle: PropTypes.object,
  itemStyle: PropTypes.object,
  loaderStyle: PropTypes.object,
  dropdownStyle: PropTypes.object,
  listClassName: PropTypes.string,
  itemClassName: PropTypes.string,
  loaderClassName: PropTypes.string,
  dropdownClassName: PropTypes.string,
  value: PropTypes.string,
  trigger: triggerPropsCheck, //eslint-disable-line
};

export default ReactTextareaAutocomplete;
