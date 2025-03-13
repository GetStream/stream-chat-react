/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-underscore-dangle */

import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Textarea from 'react-textarea-autosize';
import getCaretCoordinates from 'textarea-caret';
import clsx from 'clsx';
import { List as DefaultSuggestionList } from './List';
import { DEFAULT_CARET_POSITION, defaultScrollToItem, errorMessage } from './utils';
import { isSafari } from '../../utils/browsers';
import { CommandItem } from '../CommandItem';
import { UserItem } from '../UserItem';
import type { SuggestionItemProps, SuggestionListProps } from '../ChatAutoComplete';

import type { CustomTrigger, UnknownType } from '../../types/types';

type TextareaState = {
  actualToken: string;
  component: React.ComponentType | null;
  currentTrigger: string | null;
  data: any[] | null;
  dataLoading: boolean;
  isComposing: boolean;
  left: number | null;
  selectionEnd: number;
  selectionStart: number;
  top: number | null;
  value: string;
  propsValue: string;
};

type TextareaProps<
  V extends CustomTrigger = CustomTrigger,
  EmojiData extends UnknownType = UnknownType,
> = {
  additionalTextareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  className?: string;
  closeCommandsList?: () => void;
  closeMentionsList?: () => void;
  closeOnClickOutside?: boolean;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  disableMentions?: boolean;
  dropdownClassName?: string;
  dropdownStyle?: CSSProperties;
  grow?: boolean;
  handleSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  innerRef?: (ref: HTMLTextAreaElement | null) => void;
  itemClassName?: string;
  itemStyle?: CSSProperties;
  listClassName?: string;
  listStyle?: CSSProperties;
  loadingComponent?: React.ComponentType;
  maxRows?: number;
  minChar?: number;
  movePopupAsYouType?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onCaretPositionChange?: (position: number) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onSelect?: (event: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  replaceWord?:
    | ((word: string) => string | undefined)
    | ((word: string) => Promise<string | null>);
  scrollToItem?: boolean | ((container: HTMLDivElement, item: HTMLElement) => void);
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  showCommandsList?: boolean;
  showMentionsList?: boolean;
  style?: Omit<CSSProperties, 'height'>;
  SuggestionItem?: React.ComponentType<
    React.ComponentType<SuggestionItemProps<EmojiData>>
  >;
  SuggestionList?: React.ComponentType<SuggestionListProps<V, EmojiData>>;
  trigger: Record<
    string,
    {
      callback?: (
        item: any,
        trigger?: string,
      ) => { text: string; caretPosition: string | number };
      dataProvider: (
        token: string,
        text: string,
        callback: (data: any[], token: string) => void,
      ) => void;
      component: React.ComponentType;
      output?: (
        item: any,
        trigger?: string,
      ) => { text: string; caretPosition: string | number };
    }
  >;
  value?: string;
};

const _isCommand = (value: string) => value.startsWith('/');

export const TextareaX = <
  V extends CustomTrigger = CustomTrigger,
  EmojiData extends UnknownType = UnknownType,
>(
  props: TextareaProps<V, EmojiData>,
) => {
  const {
    closeCommandsList,
    closeMentionsList,
    closeOnClickOutside = true,
    disableMentions,
    grow = true,
    handleSubmit,
    innerRef,
    maxRows = 10,
    minChar = 1,
    movePopupAsYouType = false,
    onBlur,
    onCaretPositionChange,
    onChange,
    onFocus,
    onSelect,
    replaceWord,
    scrollToItem,
    shouldSubmit,
    showCommandsList,
    showMentionsList,
    SuggestionItem,
    SuggestionList = DefaultSuggestionList,
    trigger,
    value: initialValue = '',
    ...restProps
  } = props;

  if (!props.loadingComponent) {
    throw new Error('RTA: loadingComponent is not defined');
  }

  if (!trigger) {
    throw new Error('RTA: trigger is not defined');
  }

  const [state, setState] = useState<TextareaState>({
    actualToken: '',
    component: null,
    currentTrigger: null,
    data: null,
    dataLoading: false,
    isComposing: false,
    left: null,
    propsValue: initialValue,
    selectionEnd: 0,
    selectionStart: 0,
    top: null,
    value: initialValue,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCaretPosition = useCallback(() => {
    if (!textareaRef.current) return 0;
    return textareaRef.current.selectionEnd;
  }, []);

  const setCaretPosition = useCallback((position = 0) => {
    if (!textareaRef.current) return;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(position, position);
  }, []);

  const _closeAutocomplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentTrigger: null,
      data: null,
      dataLoading: false,
      left: null,
      top: null,
    }));
  }, []);

  const _getCurrentTriggerSettings = useCallback(
    (paramTrigger?: string) => {
      const { currentTrigger: stateTrigger } = state;
      const currentTrigger = paramTrigger || stateTrigger;
      if (!currentTrigger) return null;

      return trigger[currentTrigger];
    },
    [state.currentTrigger, trigger],
  );

  const _getValuesFromProvider = useCallback(() => {
    const { actualToken, currentTrigger } = state;
    const triggerSettings = _getCurrentTriggerSettings();

    if (!currentTrigger || !triggerSettings) return;

    const { component, dataProvider } = triggerSettings;

    if (typeof dataProvider !== 'function') {
      throw new Error('Trigger provider has to be a function!');
    }

    setState((prev) => ({ ...prev, dataLoading: true }));

    // Modified: send the full text to support / style commands
    dataProvider(actualToken, state.value, (data: unknown, token: string) => {
      // Make sure that the result is still relevant for current query
      if (token !== state.actualToken) return;

      if (!Array.isArray(data)) {
        throw new Error('Trigger provider has to provide an array!');
      }

      // throw away if we resolved old trigger
      if (currentTrigger !== state.currentTrigger) return;

      // if we haven't resolved any data let's close the autocomplete
      if (!data.length) {
        _closeAutocomplete();
        return;
      }

      setState((prev) => ({
        ...prev,
        component,
        data,
        dataLoading: false,
      }));
    });
  }, [
    state.actualToken,
    state.currentTrigger,
    state.value,
    _getCurrentTriggerSettings,
    _closeAutocomplete,
  ]);

  const _changeHandler = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      const { selectionEnd, selectionStart, value } = textarea;

      if (onChange) {
        e.persist();
        onChange(e);
      }

      if (onCaretPositionChange) onCaretPositionChange(getCaretPosition());

      setState((prev) => ({ ...prev, value }));

      let currentTrigger;
      let lastToken: string | null;

      if (_isCommand(value)) {
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

        currentTrigger =
          lastToken && Object.keys(trigger).find((a) => a === lastToken![0]);
      }

      if (!lastToken || lastToken.length <= minChar) {
        _closeAutocomplete();
        return;
      }

      const actualToken = lastToken.slice(1);

      if (!currentTrigger) return;

      if (
        movePopupAsYouType ||
        (state.top === null && state.left === null) ||
        lastToken.length === 1
      ) {
        const { left: newLeft, top: newTop } = getCaretCoordinates(
          // todo: should not be handled in LLC
          textarea,
          selectionEnd,
        );

        setState((prev) => ({
          ...prev,
          left: newLeft,
          top: newTop - (textareaRef.current?.scrollTop || 0),
        }));
      }

      setState((prev) => ({
        ...prev,
        actualToken,
        currentTrigger,
        selectionEnd,
        selectionStart,
      }));

      try {
        _getValuesFromProvider();
      } catch (err) {
        errorMessage((err as Error).message);
      }
    },
    [
      minChar,
      movePopupAsYouType,
      onChange,
      onCaretPositionChange,
      trigger,
      _isCommand,
      _closeAutocomplete,
      _getValuesFromProvider,
    ],
  );

  const _onClickAndBlurHandler = useCallback(
    (
      e: React.FocusEvent<HTMLTextAreaElement> | React.MouseEvent<HTMLTextAreaElement>,
    ) => {
      const { closeOnClickOutside, onBlur } = props;

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
        (dropdownRef.current && el instanceof Node && dropdownRef.current.contains(el)) ||
        focusedAwayInSafari
      ) {
        return;
      }

      if (closeOnClickOutside) _closeAutocomplete();

      if (onBlur && e.type === 'blur') {
        e.persist();
        onBlur(e as React.FocusEvent<HTMLTextAreaElement>);
      }
    },
    [props, _closeAutocomplete],
  );

  const _onSelect = useCallback(
    (newToken: { text: string; caretPosition: string | number }) => {
      const {
        closeCommandsList,
        closeMentionsList,
        onChange,
        showCommandsList,
        showMentionsList,
      } = props;
      const { currentTrigger: stateTrigger, selectionEnd, value: textareaValue } = state;

      const currentTrigger = showCommandsList
        ? '/'
        : showMentionsList
          ? '@'
          : stateTrigger;

      if (!currentTrigger) return;

      const computeCaretPosition = (
        position: string | number,
        token: string,
        startToken: number,
      ) => {
        switch (position) {
          case 'start':
            return startToken;
          case 'next':
          case 'end':
            return startToken + token.length;
          default:
            if (typeof position === 'number') {
              return position;
            }
            throw new Error(
              'RTA: caretPosition should be "start", "next", "end" or number.',
            );
        }
      };

      const textToModify = showCommandsList
        ? '/'
        : showMentionsList
          ? '@'
          : textareaValue.slice(0, selectionEnd);

      const startOfTokenPosition = textToModify.lastIndexOf(currentTrigger);

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
      const valueToReplace = textareaValue.replace(textToModify, modifiedText);

      setState((prev) => ({
        ...prev,
        dataLoading: false,
        value: valueToReplace,
      }));

      const e = new CustomEvent('change', { bubbles: true });
      textareaRef.current?.dispatchEvent(e);
      onChange?.(e as any);
      setCaretPosition(newCaretPosition);

      _closeAutocomplete();
      if (showCommandsList) closeCommandsList?.();
      if (showMentionsList) closeMentionsList?.();
    },
    [props, state, onChange, setCaretPosition],
  );

  const _onScrollHandler = useCallback(() => _closeAutocomplete(), [_closeAutocomplete]);

  const setDropdownRef = useCallback((element: HTMLDivElement | null) => {
    dropdownRef.current = element;
  }, []);

  /**
   * isComposing prevents double submissions in Korean and other languages.
   * starting point for a read:
   * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
   * In the long term, the fix should happen by handling keypress, but changing this has unknown implications.
   * @param event React.KeyboardEvent
   */
  const _defaultShouldSubmit = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
      event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing,
    [],
  );

  const _onEnter = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      if (!state.currentTrigger || !state.data) {
        event.persist();
        await replaceWord?.(state.value);
        if (textareaRef.current) {
          textareaRef.current.selectionEnd = 0;
        }
        handleSubmit?.(event);
        _closeAutocomplete();
      }
    },
    [state.currentTrigger, state.data, state.value, replaceWord, handleSubmit],
  );

  const _onSpace = useCallback(() => {
    if (!replaceWord || !textareaRef.current) return;

    // don't change characters if the element doesn't have focus
    const hasFocus = textareaRef.current.matches(':focus');
    if (!hasFocus) return;

    _replaceWord();
  }, [replaceWord]);

  const _replaceWord = useCallback(async () => {
    const lastWordRegex = /([^\s]+)(\s*)$/;
    const match = lastWordRegex.exec(state.value.slice(0, getCaretPosition()));
    const lastWord = match && match[1];

    if (!lastWord) return;

    const spaces = match[2];
    const newWord = await replaceWord?.(lastWord);
    if (newWord == null) return;

    const textBeforeWord = state.value.slice(0, getCaretPosition() - match[0].length);
    const textAfterCaret = state.value.slice(getCaretPosition(), -1);
    const newText = textBeforeWord + newWord + spaces + textAfterCaret;

    setState((prev) => ({ ...prev, value: newText }));

    if (textareaRef.current) {
      const e = new CustomEvent('change', { bubbles: true });
      textareaRef.current.dispatchEvent(e);
      onChange?.(e as any);
    }
  }, [state.value, getCaretPosition, replaceWord, onChange]);

  const _handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && dropdownRef.current) {
        event.preventDefault();
      }

      if ((shouldSubmit ?? _defaultShouldSubmit)(event)) return _onEnter(event);
      if (event.key === ' ') return _onSpace();
      if (event.key === 'Escape') return _closeAutocomplete();
    },
    [shouldSubmit, _defaultShouldSubmit, _onEnter, _onSpace, _closeAutocomplete],
  );

  const _getItemOnSelect = useCallback(
    (paramTrigger?: string) => {
      const { currentTrigger: stateTrigger } = state;
      const triggerSettings = _getCurrentTriggerSettings(paramTrigger);

      const currentTrigger = paramTrigger || stateTrigger;

      if (!currentTrigger || !triggerSettings) return null;

      const { callback } = triggerSettings;

      if (!callback) return null;

      return (item: any) => {
        if (typeof callback !== 'function') {
          throw new Error(
            'Output functor is not defined! You have to define "output" function.',
          );
        }
        if (callback) {
          return callback(item, currentTrigger);
        }
        return null;
      };
    },
    [state.currentTrigger, _getCurrentTriggerSettings],
  );

  const _getTextToReplace = useCallback(
    (paramTrigger?: string) => {
      const { actualToken, currentTrigger: stateTrigger } = state;
      const triggerSettings = _getCurrentTriggerSettings(paramTrigger);
      const currentTrigger = paramTrigger || stateTrigger;

      if (!currentTrigger || !triggerSettings) return null;

      const { output } = triggerSettings;

      return (item: any) => {
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
    },
    [state.actualToken, state.currentTrigger, _getCurrentTriggerSettings],
  );

  const _getSuggestions = useCallback(
    (paramTrigger?: string) => {
      const { currentTrigger: stateTrigger, data } = state;

      const currentTrigger = paramTrigger || stateTrigger;

      if (!currentTrigger || !data || (data && !data.length)) return [];

      return data;
    },
    [state.currentTrigger, state.data],
  );

  const getTriggerProps = useCallback(() => {
    const { component, currentTrigger, selectionEnd, value } = state;

    const selectedItem = _getItemOnSelect();
    const suggestionData = _getSuggestions();
    const textToReplace = _getTextToReplace();

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
      const { dataProvider } = trigger[showCommandsList ? '/' : '@'];

      dataProvider?.('', showCommandsList ? '/' : '@', (data) => {
        triggerProps.values = data;
      });

      // @ts-expect-error tmp
      triggerProps.component = showCommandsList ? CommandItem : UserItem;
      triggerProps.currentTrigger = showCommandsList ? '/' : '@';
      triggerProps.getTextToReplace = _getTextToReplace(showCommandsList ? '/' : '@');
      triggerProps.getSelectedItem = _getItemOnSelect(showCommandsList ? '/' : '@');
      triggerProps.selectionEnd = 1;
      triggerProps.value = showCommandsList ? '/' : '@';
    }

    return triggerProps;
  }, [
    state,
    _getItemOnSelect,
    _getSuggestions,
    _getTextToReplace,
    showCommandsList,
    showMentionsList,
    trigger,
  ]);

  const _dropdownScroll = useCallback(
    (item: HTMLElement) => {
      if (!scrollToItem || !dropdownRef.current) return;

      if (scrollToItem === true) {
        defaultScrollToItem(dropdownRef.current, item);
        return;
      }

      if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
        throw new Error(
          '`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.',
        );
      }

      scrollToItem(dropdownRef.current, item);
    },
    [scrollToItem],
  );

  useEffect(() => {
    if (state.currentTrigger && state.actualToken) {
      const triggerSettings = trigger[state.currentTrigger];

      setState((prev) => ({
        ...prev,
        dataLoading: true,
      }));

      triggerSettings.dataProvider(state.actualToken, state.value, (data) => {
        if (!Array.isArray(data)) {
          throw new Error('Trigger provider has to provide an array!');
        }

        setState((prev) => ({
          ...prev,
          component: triggerSettings.component,
          data,
          dataLoading: false,
        }));
      });
    }
  }, [state.currentTrigger, state.actualToken, trigger, state.value]);

  useEffect(() => {
    if (initialValue !== state.propsValue) {
      setState((prev) => ({
        ...prev,
        propsValue: initialValue,
        value: initialValue ?? '',
      }));
    }
  }, [initialValue]);

  const _cleanUpProps = useCallback(() => {
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
    const copiedProps = { ...props };
    for (const prop in copiedProps) {
      if (notSafe.includes(prop)) delete copiedProps[prop as keyof TextareaProps];
    }

    return props;
  }, [props]);

  return (
    <div
      className={clsx('rta', restProps.containerClassName, {
        ['rta--loading']: state.dataLoading,
      })}
      style={restProps.containerStyle}
    >
      {(() => {
        const triggerProps = getTriggerProps();
        if (
          state.isComposing ||
          !triggerProps.values ||
          !triggerProps.currentTrigger ||
          (disableMentions && triggerProps.currentTrigger === '@')
        ) {
          return null;
        }

        return (
          <div
            className={clsx(
              'str-chat__suggestion-list-container',
              restProps.dropdownClassName,
            )}
            ref={setDropdownRef}
            style={restProps.dropdownStyle}
          >
            {/* @ts-expect-error tmp */}
            <SuggestionList
              className={restProps.listClassName}
              dropdownScroll={_dropdownScroll}
              itemClassName={clsx(
                'str-chat__suggestion-list-item',
                restProps.itemClassName,
              )}
              itemStyle={restProps.itemStyle}
              onSelect={_onSelect}
              SuggestionItem={SuggestionItem}
              {...triggerProps}
            />
          </div>
        );
      })()}
      <Textarea
        data-testid='message-input'
        {..._cleanUpProps()}
        {...restProps.additionalTextareaProps}
        className={clsx('rta__textarea', restProps.className)}
        defaultValue={undefined}
        maxRows={grow ? maxRows : 1}
        onBlur={(e) => {
          _onClickAndBlurHandler(e);
          restProps.additionalTextareaProps?.onBlur?.(e);
        }}
        onChange={(e) => {
          _changeHandler(e);
          restProps.additionalTextareaProps?.onChange?.(e);
        }}
        onClick={(e) => {
          _onClickAndBlurHandler(e);
          restProps.additionalTextareaProps?.onClick?.(e);
        }}
        onCompositionEnd={() => setState((prev) => ({ ...prev, isComposing: false }))}
        onCompositionStart={() => setState((prev) => ({ ...prev, isComposing: true }))}
        onFocus={(e) => {
          onFocus?.(e);
          restProps.additionalTextareaProps?.onFocus?.(e);
        }}
        onKeyDown={(e) => {
          _handleKeyDown(e);
          restProps.additionalTextareaProps?.onKeyDown?.(e);
        }}
        onScroll={(e) => {
          _onScrollHandler();
          restProps.additionalTextareaProps?.onScroll?.(e);
        }}
        onSelect={(e) => {
          if (onCaretPositionChange) onCaretPositionChange(getCaretPosition());
          if (onSelect) {
            e.persist();
            onSelect(e);
          }
          restProps.additionalTextareaProps?.onSelect?.(e);
        }}
        ref={(ref) => {
          if (textareaRef) textareaRef.current = ref;
          if (innerRef) innerRef(ref);
        }}
        style={restProps.style}
        value={state.value}
      />
    </div>
  );
};
