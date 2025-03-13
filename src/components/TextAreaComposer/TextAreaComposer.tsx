import clsx from 'clsx';
import Textarea from 'react-textarea-autosize';
import React, {
  ChangeEventHandler,
  TextareaHTMLAttributes,
  UIEventHandler,
  useCallback,
  useState,
} from 'react';
import { useMessageComposer } from '../MessageInput/hooks/messageComposer/useMessageComposer';
import type { DefaultStreamChatGenerics } from '../../types';
import { useStateStore } from '../../store';
import type { FocusEvent, MouseEvent } from 'react';
import type { SearchSourceState, TextComposerState } from 'stream-chat';
import {
  useComponentContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';
import { isSafari } from '../../utils/browsers';
import { SuggestionList as DefaultSuggestionList } from './SuggestionList';
import { defaultScrollToItem } from '../AutoCompleteTextarea';

const textComposerStateSelector = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  state: TextComposerState<SCG>,
) => ({
  suggestions: state.suggestions,
  text: state.text,
});
const searchSourceStateSelector = (state: SearchSourceState) => ({
  isLoadingItems: state.isLoading,
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
 * - move cooldown logic to LLC MessageComposer
 * - disableMentions - just do not provide mentions middleware
 * - style props - just use CSS
 * - what was loadingComponent prop for?
 * - do we want to keep movePopupAsYouType prop?
 * - do we want to keep onCaretPositionChange prop?
 * - prop replaceWord logic should be included inside the TextComposerMiddleware.onChange
 * - scrollToItem prop was what for?
 */
export type TextComposerProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'style'
> & {
  closeOnClickOutside?: boolean;
  containerClassName?: string;
  dropdownClassName?: string;
  grow?: boolean;
  itemClassName?: string;
  listClassName?: string;
  maxRows?: number;
  scrollToItem?: boolean | ((container: HTMLDivElement, item: HTMLElement) => void);
  shouldSubmit?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
  // ref?: Ref<HTMLTextAreaElement>;
};

export const TextAreaComposer = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  className,
  closeOnClickOutside,
  containerClassName,
  disabled,
  dropdownClassName,
  grow,
  itemClassName,
  listClassName,
  maxRows,
  onBlur,
  onChange,
  onKeyDown,
  onScroll,
  placeholder,
  scrollToItem,
  shouldSubmit = defaultShouldSubmit,
  // ref,
  ...restProps
}: TextComposerProps) => {
  const { t } = useTranslationContext();
  const { AutocompleteSuggestionList = DefaultSuggestionList } = useComponentContext();
  const { cooldownRemaining, textareaRef } = useMessageInputContext();
  const messageComposer = useMessageComposer<SCG>();
  const { textComposer } = messageComposer;

  const { suggestions, text } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  const { isLoadingItems } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};

  const [isComposing, setIsComposing] = useState(false);

  const [suggestionListContainer, setSuggestionListContainer] =
    useState<HTMLDivElement | null>(null);

  const clickAndBlurHandler = useCallback(
    (e: FocusEvent<HTMLTextAreaElement> | MouseEvent<HTMLTextAreaElement>) => {
      // If this is a click: e.target is the textarea, and e.relatedTarget is the thing
      // that was actually clicked. If we clicked inside the suggestions dropdown, then
      // that's not a blur so then do nothing.
      const { relatedTarget } = e;
      // If this is a blur event in Safari, then relatedTarget is never a dropdown item, but a common parent
      // of textarea and dropdown container. That means that suggestionListContainer will not contain its parent and the
      // suggestion list will be closed before onclick handler can be invoked selecting an item.
      // It seems that Safari has different implementation determining the relatedTarget node than Chrome and Firefox.
      // Therefore, if focused away in Safari, the dropdown will be kept rendered until pressing Esc or selecting and item from it.
      const blurredInSafari = isSafari() && e.type === 'blur';
      if (
        (suggestionListContainer &&
          relatedTarget instanceof Node &&
          suggestionListContainer.contains(relatedTarget)) ||
        blurredInSafari
      ) {
        return;
      }

      if (closeOnClickOutside) textComposer.closeSuggestions();

      if (onBlur) {
        onBlur(e as FocusEvent<HTMLTextAreaElement>);
      }
    },
    [closeOnClickOutside, suggestionListContainer, onBlur, textComposer],
  );

  const changeHandler: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      if (onChange) {
        onChange(e);
        return;
      }
      if (!textareaRef.current) return;
      textComposer.handleChange({
        selection: {
          start: textareaRef.current.selectionStart,
          end: textareaRef.current.selectionEnd,
        },
        text: e.target.value,
      });
    },
    [onChange, textComposer],
  );

  const onCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  const onCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const _onEnter = useCallback(
    async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!textareaRef.current) return;

      /**
       * todo: move to EmojisMiddleware so that on each change event, the text is already adjusted and not having to do this on keyDown event.
       * Should be adjusted on enter and space
       */
      // await replaceWord?.(text);
      textareaRef.current.selectionEnd = 0;
      messageComposer.sendMessage();
      textComposer.closeSuggestions();
    },
    [messageComposer, textComposer],
  );

  const keyDownHandler = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (onKeyDown) {
        onKeyDown(event);
        return;
      }

      if (
        (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
        suggestionListContainer
      ) {
        event.preventDefault();
        return;
      }

      if (shouldSubmit(event)) return _onEnter(event);
      if (event.key === 'Escape') return textComposer.closeSuggestions();
    },
    [onKeyDown, shouldSubmit, _onEnter],
  );

  const scrollHandler: UIEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      onScroll ? onScroll(event) : textComposer.closeSuggestions();
    },
    [onScroll, textComposer],
  );

  const _dropdownScroll = useCallback(
    (item: HTMLElement) => {
      if (!scrollToItem || !suggestionListContainer) return;

      if (scrollToItem === true) {
        defaultScrollToItem(suggestionListContainer, item);
        return;
      }

      if (typeof scrollToItem !== 'function' || scrollToItem.length !== 2) {
        throw new Error(
          '`scrollToItem` has to be boolean (true for default implementation) or function with two parameters: container, item.',
        );
      }

      scrollToItem(suggestionListContainer, item);
    },
    [scrollToItem, suggestionListContainer],
  );

  return (
    <div
      className={clsx('rta', 'str-chat__textarea str-chat__message-textarea-react-host', {
        ['rta--loading']: isLoadingItems,
      })}
    >
      {!isComposing && !!suggestions && (
        <div
          className={clsx('str-chat__suggestion-list-container', dropdownClassName)}
          ref={setSuggestionListContainer}
        >
          <AutocompleteSuggestionList
            className={listClassName}
            dropdownScroll={_dropdownScroll} // todo: move into SuggestionList
            // onSelect={_onSelect} todo: move into SuggestionList as textComposer.handleSelect()
          />
        </div>
      )}
      <Textarea
        {...restProps}
        aria-label={cooldownRemaining ? t('Slow Mode ON') : placeholder}
        className={clsx(
          'rta__textarea',
          'str-chat__textarea__textarea str-chat__message-textarea',
        )}
        data-testid='message-input'
        defaultValue={undefined}
        disabled={disabled || !!cooldownRemaining}
        maxRows={grow ? maxRows : 1}
        onBlur={clickAndBlurHandler}
        onChange={changeHandler}
        onClick={clickAndBlurHandler}
        onCompositionEnd={onCompositionEnd}
        onCompositionStart={onCompositionStart}
        onKeyDown={keyDownHandler}
        onScroll={scrollHandler}
        onSelect={(e) => {
          // todo: original calls props.onCaretPositionChange and props.onSelect, but maybe not necessary
        }}
        placeholder={placeholder || t('Type your message')}
        ref={(ref) => {
          textareaRef.current = ref;
        }}
        value={text}
      />
    </div>
  );
};
