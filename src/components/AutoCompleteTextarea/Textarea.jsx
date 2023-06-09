import React from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';
import getCaretCoordinates from 'textarea-caret';
import { isValidElementType } from 'react-is';
import clsx from 'clsx';

import { List as DefaultSuggestionList } from './List';
import {
  DEFAULT_CARET_POSITION,
  defaultScrollToItem,
  errorMessage,
  triggerPropsCheck,
} from './utils';

import { CommandItem } from '../CommandItem';
import { UserItem } from '../UserItem';
import { isSafari } from '../../utils/browsers';

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
      left: null,
      selectionEnd: 0,
      selectionStart: 0,
      top: null,
      value: value || '',
    };
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

  /**
   * isComposing prevents double submissions in Korean and other languages.
   * starting point for a read:
   * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
   * In the long term, the fix should happen by handling keypress, but changing this has unknown implications.
   * @param event React.KeyboardEvent
   */
  _defaultShouldSubmit = (event) =>
    event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

  _handleKeyDown = (event) => {
    const { shouldSubmit = this._defaultShouldSubmit } = this.props;

    // prevent default behaviour when the selection list is rendered
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && this.dropdownRef)
      event.preventDefault();

    if (shouldSubmit?.(event)) return this._onEnter(event);
    if (event.key === ' ') return this._onSpace(event);
    if (event.key === 'Escape') return this._closeAutocomplete();
  };

  _onEnter = (event) => {
    if (!this.textareaRef) return;

    const trigger = this.state.currentTrigger;

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
    const {
      closeCommandsList,
      closeMentionsList,
      onChange,
      showCommandsList,
      showMentionsList,
    } = this.props;
    const { currentTrigger: stateTrigger, selectionEnd, value: textareaValue } = this.state;

    const currentTrigger = showCommandsList ? '/' : showMentionsList ? '@' : stateTrigger;

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

    const textToModify = showCommandsList
      ? '/'
      : showMentionsList
      ? '@'
      : textareaValue.slice(0, selectionEnd);

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
    if (showCommandsList) closeCommandsList();
    if (showMentionsList) closeMentionsList();
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

  /**
   * setup to emulate the UNSAFE_componentWillReceiveProps
   */
  static getDerivedStateFromProps(props, state) {
    if (props.value !== state.propsValue || !state.value) {
      return { propsValue: props.value, value: props.value };
    } else {
      return null;
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
      'closeMentionsList',
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
      'shouldSubmit',
      'showCommandsList',
      'showMentionsList',
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

    return tokens.length <= 1;
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
    // If this is a blur event in Safari, then relatedTarget is never a dropdown item, but a common parent
    // of textarea and dropdown container. That means that dropdownRef will not contain its parent and the
    // autocomplete will be closed before onclick handler can be invoked selecting an item.
    // It seems that Safari has different implementation determining the relatedTarget node than Chrome and Firefox.
    // Therefore, if focused away in Safari, the dropdown will be kept rendered until pressing Esc or selecting and item from it.
    const focusedAwayInSafari = isSafari() && e.type === 'blur';
    if (
      (this.dropdownRef && el instanceof Node && this.dropdownRef.contains(el)) ||
      focusedAwayInSafari
    ) {
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
    const { showCommandsList, showMentionsList, trigger } = this.props;
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

    if ((showCommandsList && trigger['/']) || (showMentionsList && trigger['@'])) {
      let currentCommands;
      const getCommands = trigger[showCommandsList ? '/' : '@'].dataProvider;

      getCommands?.('', showCommandsList ? '/' : '@', (data) => {
        currentCommands = data;
      });

      triggerProps.component = showCommandsList ? CommandItem : UserItem;
      triggerProps.currentTrigger = showCommandsList ? '/' : '@';
      triggerProps.getTextToReplace = this._getTextToReplace(showCommandsList ? '/' : '@');
      triggerProps.getSelectedItem = this._getItemOnSelect(showCommandsList ? '/' : '@');
      triggerProps.selectionEnd = 1;
      triggerProps.value = showCommandsList ? '/' : '@';
      triggerProps.values = currentCommands;
    }

    return triggerProps;
  };

  setDropdownRef = (element) => {
    this.dropdownRef = element;
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
          className={clsx(
            'rta__autocomplete',
            'str-chat__suggestion-list-container',
            dropdownClassName,
          )}
          ref={this.setDropdownRef}
          style={dropdownStyle}
        >
          <SuggestionList
            className={clsx('str-chat__suggestion-list', listClassName)}
            dropdownScroll={this._dropdownScroll}
            itemClassName={clsx('str-chat__suggestion-list-item', itemClassName)}
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
    const {
      onBlur,
      onChange,
      onClick,
      onFocus,
      onKeyDown,
      onScroll,
      onSelect,
      ...restAdditionalTextareaProps
    } = this.props.additionalTextareaProps || {};

    let { maxRows } = this.props;

    const { dataLoading, value } = this.state;

    if (!this.props.grow) maxRows = 1;

    // By setting defaultValue to undefined, avoid error:
    // ForwardRef(TextareaAutosize) contains a textarea with both value and defaultValue props.
    // Textarea elements must be either controlled or uncontrolled

    return (
      <div
        className={clsx('rta', containerClassName, {
          'rta--loading': dataLoading,
        })}
        style={containerStyle}
      >
        {this.renderSuggestionListContainer()}
        <Textarea
          data-testid='message-input'
          {...this._cleanUpProps()}
          className={clsx('rta__textarea', className)}
          maxRows={maxRows}
          onBlur={(e) => {
            this._onClickAndBlurHandler(e);
            onBlur?.(e);
          }}
          onChange={(e) => {
            this._changeHandler(e);
            onChange?.(e);
          }}
          onClick={(e) => {
            this._onClickAndBlurHandler(e);
            onClick?.(e);
          }}
          onFocus={(e) => {
            this.props.onFocus?.(e);
            onFocus?.(e);
          }}
          onKeyDown={(e) => {
            this._handleKeyDown(e);
            onKeyDown?.(e);
          }}
          onScroll={(e) => {
            this._onScrollHandler(e);
            onScroll?.(e);
          }}
          onSelect={(e) => {
            this._selectHandler(e);
            onSelect?.(e);
          }}
          ref={(ref) => {
            this.props?.innerRef(ref);
            this.textareaRef = ref;
          }}
          style={style}
          value={value}
          {...restAdditionalTextareaProps}
          defaultValue={undefined}
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
  shouldSubmit: PropTypes.func,
  style: PropTypes.object,
  SuggestionList: PropTypes.elementType,
  trigger: triggerPropsCheck,
  value: PropTypes.string,
};
