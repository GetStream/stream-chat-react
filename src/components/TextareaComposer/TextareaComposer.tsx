import clsx from 'clsx';
import type {
  ChangeEventHandler,
  SyntheticEvent,
  TextareaHTMLAttributes,
  UIEventHandler,
} from 'react';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Textarea from 'react-textarea-autosize';
import { useMessageComposer } from '../MessageInput';
import type {
  AttachmentManagerState,
  MessageComposerConfig,
  MessageComposerState,
  SearchSourceState,
  TextComposerState,
} from 'stream-chat';
import {
  useComponentContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { SuggestionList as DefaultSuggestionList } from './SuggestionList';
import { useSendMessageFn } from '../MessageInput/hooks/useSendMessageFn';

const textComposerStateSelector = (state: TextComposerState) => ({
  selection: state.selection,
  suggestions: state.suggestions,
  text: state.text,
});

const searchSourceStateSelector = (state: SearchSourceState) => ({
  isLoadingItems: state.isLoading,
  items: state.items,
});

const configStateSelector = (state: MessageComposerConfig) => ({
  enabled: state.text.enabled,
});

const messageComposerStateSelector = (state: MessageComposerState) => ({
  quotedMessage: state.quotedMessage,
});

const attachmentManagerStateSelector = (state: AttachmentManagerState) => ({
  attachments: state.attachments,
});

/**
 * isComposing prevents double submissions in Korean and other languages.
 * starting point for a read:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
 * In the long term, the fix should happen by handling keypress, but changing this has unknown implications.
 */
const defaultShouldSubmit = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

export type TextareaComposerProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style' | 'defaultValue' | 'disabled' | 'value'
> & {
  closeSuggestionsOnClickOutside?: boolean;
  containerClassName?: string;
  listClassName?: string;
  maxRows?: number;
  minRows?: number;
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
};

export const TextareaComposer = ({
  className,
  closeSuggestionsOnClickOutside,
  containerClassName,
  listClassName,
  maxRows: maxRowsProp,
  minRows: minRowsProp,
  onBlur,
  onChange,
  onKeyDown,
  onScroll,
  onSelect,
  placeholder: placeholderProp,
  shouldSubmit: shouldSubmitProp,
  ...restTextareaProps
}: TextareaComposerProps) => {
  const { t } = useTranslationContext();
  const { AutocompleteSuggestionList = DefaultSuggestionList } = useComponentContext();
  const {
    additionalTextareaProps,
    cooldownRemaining,
    focus,
    maxRows: maxRowsContext,
    minRows: minRowsContext,
    onPaste,
    shouldSubmit: shouldSubmitContext,
    textareaRef,
  } = useMessageInputContext();
  const maxRows = maxRowsProp ?? maxRowsContext ?? 1;
  const minRows = minRowsProp ?? minRowsContext;
  const placeholder = placeholderProp ?? additionalTextareaProps?.placeholder;
  const shouldSubmit = shouldSubmitProp ?? shouldSubmitContext ?? defaultShouldSubmit;

  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { selection, suggestions, text } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  const sendMessage = useSendMessageFn();

  const { enabled } = useStateStore(messageComposer.configState, configStateSelector);
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );
  const { attachments } = useStateStore(
    messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
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

      if (
        textComposer.suggestions &&
        textComposer.suggestions.searchSource.items?.length
      ) {
        if (event.key === 'Escape') return textComposer.closeSuggestions();
        const loadedItems = textComposer.suggestions.searchSource.items;
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
      } else if (
        shouldSubmit(event) &&
        textareaRef.current &&
        messageComposer.hasSendableData
      ) {
        if (event.key === 'Enter') {
          // prevent adding newline when submitting a message with
          event.preventDefault();
        }
        sendMessage();
      }
    },
    [
      focusedItemIndex,
      messageComposer,
      onKeyDown,
      sendMessage,
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

  const setSelection = useCallback(
    (e: SyntheticEvent<HTMLTextAreaElement>) => {
      onSelect?.(e);
      textComposer.setSelection({
        end: (e.target as HTMLTextAreaElement).selectionEnd,
        start: (e.target as HTMLTextAreaElement).selectionStart,
      });
    },
    [onSelect, textComposer],
  );

  useEffect(() => {
    if (textComposer.suggestions) {
      setFocusedItemIndex(0);
    }
  }, [textComposer.suggestions]);

  useEffect(() => {
    const textareaIsFocused = textareaRef.current?.matches(':focus');
    if (!textareaRef.current || textareaIsFocused || !focus) return;
    textareaRef.current.focus();
  }, [attachments, focus, quotedMessage, textareaRef]);

  useLayoutEffect(() => {
    /**
     * It is important to perform set text and after that the range
     * to prevent cursor reset to the end of the textarea if doing it in separate effects.
     */
    const textarea = textareaRef.current;
    if (!textarea || isComposing) return;

    /**
     * The textarea value has to be overridden outside the render cycle so that the events like compositionend can be triggered.
     * If we have overridden the value during the component rendering, the compositionend event would not be triggered, and
     * it would not be possible to type composed characters (ô).
     * On the other hand, just removing the value override via prop (value={text}) would not allow us to change the text based on
     * middleware results (e.g. replace characters with emojis)
     */
    if (textarea.value !== text) {
      textarea.value = text;
    }

    const length = textarea.value.length;
    const start = Math.max(0, Math.min(selection.start, length));
    const end = Math.max(start, Math.min(selection.end, length));

    if (textarea.selectionStart === start && textarea.selectionEnd === end) return;

    textarea.setSelectionRange(start, end, 'forward');
  }, [text, selection.start, selection.end, isComposing, textareaRef]);

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
        {...{ ...additionalTextareaProps, ...restTextareaProps }}
        aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
        className={clsx(
          'rta__textarea',
          'str-chat__textarea__textarea str-chat__message-textarea',
          className,
        )}
        data-testid='message-input'
        disabled={!enabled || !!cooldownRemaining}
        maxRows={maxRows}
        minRows={minRows}
        onBlur={onBlur}
        onChange={changeHandler}
        onCompositionEnd={onCompositionEnd}
        onCompositionStart={onCompositionStart}
        onKeyDown={keyDownHandler}
        onPaste={onPaste}
        onScroll={scrollHandler}
        onSelect={setSelection}
        placeholder={placeholder || t('Type your message')}
        ref={(ref) => {
          textareaRef.current = ref;
        }}
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
