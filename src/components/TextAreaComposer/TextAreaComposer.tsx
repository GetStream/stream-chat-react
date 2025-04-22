import clsx from 'clsx';
import type { ChangeEventHandler, TextareaHTMLAttributes, UIEventHandler } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Textarea from 'react-textarea-autosize';
import { useMessageComposer } from '../MessageInput';
import type { SearchSourceState, TextComposerState } from 'stream-chat';
import {
  useComponentContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { SuggestionList as DefaultSuggestionList } from './SuggestionList';

const textComposerStateSelector = (state: TextComposerState) => ({
  selection: state.selection,
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (state: SearchSourceState) => ({
  isLoadingItems: state.isLoading,
  items: state.items,
});

/**
 * isComposing prevents double submissions in Korean and other languages.
 * starting point for a read:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
 * In the long term, the fix should happen by handling keypress, but changing this has unknown implications.
 */
const defaultShouldSubmit = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

/**
 * TODO: X
 * - disableMentions - just do not provide mentions middleware
 * - style props - just use CSS
 * - what was loadingComponent prop for?
 * - do we want to keep movePopupAsYouType prop?
 * - do we want to keep onCaretPositionChange prop?
 * - scrollToItem prop was what for? - removing it todo: document it
 */
export type TextComposerProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style' | 'defaultValue'
> & {
  closeSuggestionsOnClickOutside?: boolean;
  containerClassName?: string;
  dropdownClassName?: string;
  grow?: boolean;
  itemClassName?: string;
  listClassName?: string;
  maxRows?: number;
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

export const TextAreaComposer = ({
  className,
  closeSuggestionsOnClickOutside,
  containerClassName,
  disabled,
  // dropdownClassName, // todo: X find a different way to prevent prop drilling
  grow: growProp,
  // itemClassName, // todo: X find a different way to prevent prop drilling
  listClassName,
  maxRows: maxRowsProp = 1,
  onBlur,
  onChange,
  onKeyDown,
  onScroll,
  placeholder: placeholderProp,
  shouldSubmit: shouldSubmitProp,
  ...restProps
}: TextComposerProps) => {
  const { t } = useTranslationContext();
  const { AutocompleteSuggestionList = DefaultSuggestionList } = useComponentContext();
  const {
    additionalTextareaProps,
    cooldownRemaining,
    grow: growContext,
    handleSubmit,
    maxRows: maxRowsContext,
    onPaste,
    shouldSubmit: shouldSubmitContext,
    textareaRef,
  } = useMessageInputContext();

  const grow = growProp ?? growContext;
  const maxRows = maxRowsProp ?? maxRowsContext;
  const placeholder = placeholderProp ?? additionalTextareaProps?.placeholder;
  const shouldSubmit = shouldSubmitProp ?? shouldSubmitContext ?? defaultShouldSubmit;

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { selection, suggestions, text } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );

  const { isLoadingItems } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};

  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);

  const [isComposing, setIsComposing] = useState(false);

  const changeHandler: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      if (onChange) {
        onChange(e);
        return;
      }
      if (!textareaRef.current) return;
      textComposer.handleChange({
        selection: {
          end: textareaRef.current.selectionEnd,
          start: textareaRef.current.selectionStart,
        },
        text: e.target.value,
      });
    },
    [onChange, textComposer, textareaRef],
  );

  const onCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  const onCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const keyDownHandler = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (onKeyDown) {
        onKeyDown(event);
        return;
      }

      if (event.key === 'Enter') {
        // allow next line only on Shift + Enter. Enter is reserved for submission.
        event.preventDefault();
      }

      if (
        textComposer.suggestions &&
        textComposer.suggestions.searchSource.items?.length
      ) {
        if (event.key === 'Escape') return textComposer.closeSuggestions();
        const loadedItems = textComposer.suggestions.searchSource.items;
        if (event.key === 'Enter') {
          textComposer.handleSelect(loadedItems[focusedItemIndex]);
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setFocusedItemIndex((prev) => {
            let nextIndex = prev - 1;
            if (suggestions?.searchSource.hasNext) {
              nextIndex = prev;
            } else if (nextIndex < 0) {
              nextIndex = loadedItems.length - 1;
            }
            return nextIndex;
          });
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setFocusedItemIndex((prev) => {
            let nextIndex = prev + 1;
            if (suggestions?.searchSource.hasNext) {
              nextIndex = prev;
            } else if (nextIndex >= loadedItems.length) {
              nextIndex = 0;
            }

            return nextIndex;
          });
        }
      } else if (shouldSubmit(event) && textareaRef.current) {
        handleSubmit();
        textareaRef.current.selectionEnd = 0;
      }
    },
    [
      focusedItemIndex,
      handleSubmit,
      onKeyDown,
      shouldSubmit,
      suggestions,
      textComposer,
      textareaRef,
    ],
  );

  const scrollHandler: UIEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      if (onScroll) {
        onScroll(event);
      } else {
        textComposer.closeSuggestions();
      }
    },
    [onScroll, textComposer],
  );

  useEffect(() => {
    // FIXME: find the real reason for cursor being set to the end on each change
    // This is a workaround to prevent the cursor from jumping
    // to the end of the textarea when the user is typing
    // at the position that is not at the end of the textarea value.
    if (textareaRef.current && !isComposing) {
      textareaRef.current.selectionStart = selection.start;
      textareaRef.current.selectionEnd = selection.end;
    }
  }, [text, textareaRef, selection.start, selection.end, isComposing]);

  useEffect(() => {
    if (textComposer.suggestions) {
      setFocusedItemIndex(0);
    }
  }, [textComposer.suggestions]);

  return (
    <div
      className={clsx(
        'rta',
        'str-chat__textarea str-chat__message-textarea-react-host',
        containerClassName,
        {
          ['rta--loading']: isLoadingItems,
        },
      )}
      ref={containerRef}
    >
      <Textarea
        {...restProps}
        aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
        className={clsx(
          'rta__textarea',
          'str-chat__textarea__textarea str-chat__message-textarea',
          className,
        )}
        data-testid='message-input'
        disabled={disabled || !!cooldownRemaining}
        maxRows={grow ? maxRows : 1}
        onBlur={onBlur}
        onChange={changeHandler}
        onCompositionEnd={onCompositionEnd}
        onCompositionStart={onCompositionStart}
        onKeyDown={keyDownHandler}
        onPaste={onPaste}
        onScroll={scrollHandler}
        placeholder={placeholder || t('Type your message')}
        ref={(ref) => {
          textareaRef.current = ref;
        }}
        value={text}
      />
      {/* todo: X document the layout change for the accessibility purpose (tabIndex) */}
      {!isComposing && (
        <AutocompleteSuggestionList
          className={listClassName}
          closeOnClickOutside={closeSuggestionsOnClickOutside}
          focusedItemIndex={focusedItemIndex}
          setFocusedItemIndex={setFocusedItemIndex}
        />
      )}
    </div>
  );
};
