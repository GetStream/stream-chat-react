import clsx from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Textarea from 'react-textarea-autosize';
import { useMessageComposer } from '../MessageInput/hooks/messageComposer/useMessageComposer';

import type { ChangeEventHandler, TextareaHTMLAttributes, UIEventHandler } from 'react';
import type { SearchSourceState, TextComposerState } from 'stream-chat';
import {
  useComponentContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { SuggestionList as DefaultSuggestionList } from './SuggestionList';

const textComposerStateSelector = (state: TextComposerState) => ({
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
 * TODO:
 * - disableMentions - just do not provide mentions middleware
 * - style props - just use CSS
 * - what was loadingComponent prop for?
 * - do we want to keep movePopupAsYouType prop?
 * - do we want to keep onCaretPositionChange prop?
 * - scrollToItem prop was what for? - removing it todo: document it
 */
export type TextComposerProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style'
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
  // dropdownClassName, // todo: find a different way to prevent prop drilling
  grow,
  // itemClassName, // todo: find a different way to prevent prop drilling
  listClassName,
  maxRows,
  onBlur,
  onChange,
  onKeyDown,
  onScroll,
  placeholder,
  shouldSubmit = defaultShouldSubmit,
  ...restProps
}: TextComposerProps) => {
  const { t } = useTranslationContext();
  const { AutocompleteSuggestionList = DefaultSuggestionList } = useComponentContext();
  const { cooldownRemaining, handleSubmit, textareaRef } = useMessageInputContext();

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions, text } = useStateStore(
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
      // todo: submit message with commands (giphy, ban @mention, etc)
      if (textComposer.suggestions) {
        if (event.key === 'Escape') return textComposer.closeSuggestions();
        const loadedItems = textComposer.suggestions.searchSource.items;
        if (loadedItems?.length) {
          if (event.key === 'Enter') {
            event.preventDefault();
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
        }
      } else if (shouldSubmit(event) && textareaRef.current) {
        event.preventDefault();
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
        defaultValue={undefined}
        disabled={disabled || !!cooldownRemaining}
        maxRows={grow ? maxRows : 1}
        onBlur={onBlur}
        onChange={changeHandler}
        onCompositionEnd={onCompositionEnd}
        onCompositionStart={onCompositionStart}
        onKeyDown={keyDownHandler}
        onScroll={scrollHandler}
        placeholder={placeholder || t('Type your message')}
        ref={(ref) => {
          textareaRef.current = ref;
        }}
        value={text}
      />
      {/* todo: document the layout change for the accessibility purpose (tabIndex) */}
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
