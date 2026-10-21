import clsx from 'clsx';
import React, {
  type ChangeEventHandler,
  type SyntheticEvent,
  type TextareaHTMLAttributes,
  type UIEventHandler,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Textarea from 'react-textarea-autosize';
import { useCooldownRemaining } from '../MessageComposer/hooks/useCooldownRemaining';
import { useMessageComposerCommands } from '../MessageComposer/hooks/useMessageComposerCommands';
import { useMessageComposerController } from '../MessageComposer/hooks/useMessageComposerController';
import type {
  AttachmentManagerState,
  MessageComposerConfig,
  MessageComposerState,
  SearchSourceState,
  TextComposerState,
} from 'stream-chat';
import {
  useComponentContext,
  useMessageComposerContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { useStableId } from '../UtilityComponents/useStableId';
import {
  SuggestionList as DefaultSuggestionList,
  hasEnabledCommandSuggestions,
} from './SuggestionList';
import { useTextareaPlaceholder } from './hooks/useTextareaPlaceholder';
import { useAriaLiveAnnouncer, useInteractionAnnouncements } from '../Accessibility';
import { useMessageComposerHasSendableData } from '../MessageComposer/hooks/useMessageComposerHasSendableData';
import { useMessageComposerSubmitFn } from '../MessageComposer/hooks/useMessageComposerSubmitFn';

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
 * Enter without Shift submits. The `isComposing` check prevents double submissions while an IME
 * composes text, e.g. in Korean
 * (https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing).
 */
const defaultShouldSubmit = (event: React.KeyboardEvent<HTMLTextAreaElement>) =>
  event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;

export const shouldBackspaceExitCommandMode = (text: string) => text.length === 0;

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

/**
 * Textarea of the message composer, with autocomplete suggestions and screen reader announcements.
 * Announcements go to the nearest `AriaLiveOutlet`: the root outlet in `Chat`, or a modal outlet
 * inside an `aria-modal` dialog, because assistive technologies ignore live regions outside the
 * active modal.
 */
export const TextareaComposer = (props: TextareaComposerProps) => (
  <TextareaComposerWithLiveAnnouncements {...props} />
);

const TextareaComposerWithLiveAnnouncements = ({
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
  const { AutocompleteSuggestionList = DefaultSuggestionList } = useComponentContext();
  const {
    additionalTextareaProps,
    focus,
    maxRows: maxRowsContext,
    minRows: minRowsContext,
    onPaste,
    shouldSubmit: shouldSubmitContext,
    textareaRef,
  } = useMessageComposerContext();
  const cooldownRemaining = useCooldownRemaining();

  const { t } = useTranslationContext();
  const placeholder = useTextareaPlaceholder({ placeholder: placeholderProp });
  const announce = useAriaLiveAnnouncer();
  const { announceInteraction } = useInteractionAnnouncements();

  const maxRows = maxRowsProp ?? maxRowsContext ?? 10;
  const minRows = minRowsProp ?? minRowsContext;

  const shouldSubmit = shouldSubmitProp ?? shouldSubmitContext ?? defaultShouldSubmit;

  const messageComposer = useMessageComposerController();
  // Read through the hook, not off the composer, so Enter-to-submit agrees with the send button.
  const hasSendableData = useMessageComposerHasSendableData();
  const { textComposer } = messageComposer;
  const { selection, suggestions, text } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  // Explicit accessible name, so the field does not inherit an unrelated one from an ancestor.
  // Empty: the visible placeholder. With content: a stable label, because the placeholder may be a
  // command-specific template that would be re-announced as a stale name.
  const ariaLabel = text
    ? t('textareaComposer.messageInput.ariaLabel', 'Message input')
    : placeholder;

  // react-textarea-autosize can measure the placeholder as multi-line in narrow layouts, inflating
  // the initial height. Clamp to one row while empty unless `minRows` is set.
  const autosizeRows = !text && minRows == null ? 1 : undefined;
  const textareaStyle = text
    ? undefined
    : ({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      } satisfies React.CSSProperties);
  const submitMessage = useMessageComposerSubmitFn();

  const { enabled } = useStateStore(messageComposer.configState, configStateSelector);
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );
  const { attachments } = useStateStore(
    messageComposer.attachmentManager.state,
    attachmentManagerStateSelector,
  );

  const { isLoadingItems, items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};

  const containerRef = useRef<HTMLDivElement>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  // Whether the active option was reached with the arrow keys in the current suggestion session.
  // Filtering resets `focusedItemIndex` to 0 on every keystroke, so always exposing
  // `aria-activedescendant` would make screen readers re-read the first option per character. It is
  // cleared on typing (see `changeHandler`), and the debounced suggestion count covers typing.
  const [activeOptionFromKeyboard, setActiveOptionFromKeyboard] = useState(false);

  // The list is a `listbox` whose active `option` this field tracks through `aria-controls` and
  // `aria-activedescendant`, with no `role="combobox"` or `aria-expanded` because axe rejects them
  // on a multiline textarea. `aria-controls` is set while the list is open, `aria-activedescendant`
  // only after keyboard navigation. "Open" matches what `SuggestionList` renders, so neither
  // attribute dangles. `listboxId` lives here because the attributes are on the textarea; the list
  // derives option IDs as `{listboxId}-option-{index}`.
  const listboxId = useStableId();
  const commands = useMessageComposerCommands();
  const suggestionsOpen = !!(
    suggestions &&
    items?.length &&
    hasEnabledCommandSuggestions({ commands, type: suggestions?.searchSource.type })
  );
  const activeDescendantId =
    suggestionsOpen && activeOptionFromKeyboard
      ? `${listboxId}-option-${focusedItemIndex}`
      : undefined;

  const [isComposing, setIsComposing] = useState(false);

  const changeHandler: ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (e) => {
      // Typing resets the highlight to the first item; stop exposing the active option until the
      // next arrow key so screen readers do not re-read it on every keystroke.
      setActiveOptionFromKeyboard(false);
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

      // The composer state is a step behind, so read the textarea value directly.
      const textareaValue = textareaRef.current?.value ?? event.currentTarget.value;

      if (
        textComposer.suggestions &&
        textComposer.suggestions.searchSource.items?.length
      ) {
        if (event.key === 'Escape') return textComposer.closeSuggestions();
        // `focusedItemIndex` indexes the same `searchSource.items` array the list renders, so the
        // option announced to screen readers is the one Enter inserts.
        const loadedItems = textComposer.suggestions.searchSource.items;
        if (event.key === 'Enter') {
          event.preventDefault();
          const selectedItem = loadedItems[focusedItemIndex];
          if (selectedItem) {
            textComposer.handleSelect(selectedItem);
          }
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveOptionFromKeyboard(true);
          setFocusedItemIndex((prev) => {
            let nextIndex = prev - 1;
            if (nextIndex < 0) {
              nextIndex = loadedItems.length - 1;
            }
            return nextIndex;
          });
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveOptionFromKeyboard(true);
          setFocusedItemIndex((prev) => {
            let nextIndex = prev + 1;
            if (nextIndex >= loadedItems.length) {
              nextIndex = 0;
            }

            return nextIndex;
          });
        }
      } else if (
        textComposer.command &&
        (event.key === 'Escape' ||
          (event.key === 'Backspace' && shouldBackspaceExitCommandMode(textareaValue)))
      ) {
        event.preventDefault();
        textComposer.clearCommand();
      } else if (shouldSubmit(event) && textareaRef.current && hasSendableData) {
        if (event.key === 'Enter') {
          // prevent inserting a newline when submitting with Enter
          event.preventDefault();
        }
        submitMessage();
      }
    },
    [
      focusedItemIndex,
      hasSendableData,
      onKeyDown,
      shouldSubmit,
      submitMessage,
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
    const suggestionItems = suggestions?.searchSource.items;
    if (!suggestionItems?.length) return;

    setFocusedItemIndex((prev) =>
      prev >= suggestionItems.length ? suggestionItems.length - 1 : prev,
    );
  }, [suggestions?.searchSource.items]);

  useEffect(() => {
    const textareaIsFocused = textareaRef.current?.matches(':focus');
    if (!textareaRef.current || textareaIsFocused || !focus) return;
    textareaRef.current.focus();
  }, [attachments, focus, quotedMessage, textareaRef]);

  // Announces command activation (e.g. `/giphy`) only while the textarea is focused: otherwise the
  // focus shift that follows already makes assistive technology re-announce the field. Subscribed
  // synchronously so the `activeElement` check runs before that `focus()` call, and deferred to
  // `requestAnimationFrame` so the DOM already carries the command-specific placeholder.
  useEffect(() => {
    const pendingFrames = new Set<number>();
    const unsubscribe = textComposer.state.subscribeWithSelector(
      (state) => ({ commandName: state.command?.name ?? null }),
      ({ commandName }, previous) => {
        if (!previous) return;
        if (!commandName || commandName === previous.commandName) return;
        if (document.activeElement !== textareaRef.current) return;

        const frame = window.requestAnimationFrame(() => {
          pendingFrames.delete(frame);
          const label = textareaRef.current?.placeholder;
          if (label) announce(label, { priority: 'polite' });
        });
        pendingFrames.add(frame);
      },
    );
    return () => {
      unsubscribe();
      pendingFrames.forEach(window.cancelAnimationFrame);
    };
  }, [announce, textComposer.state, textareaRef]);

  // Announces a user picked from the @-mention autocomplete, only when a new user is appended. The
  // count lives in a ref because the listener can run more than once per selection, and the
  // per-call `previous` would make each run see growth and announce twice.
  const lastMentionCountRef = useRef<number | null>(null);
  useEffect(() => {
    lastMentionCountRef.current =
      textComposer.state.getLatestValue().mentionedUsers?.length ?? 0;
    const unsubscribe = textComposer.state.subscribeWithSelector(
      (state) => ({ mentionedUsers: state.mentionedUsers }),
      ({ mentionedUsers }) => {
        const previousCount = lastMentionCountRef.current ?? mentionedUsers.length;
        lastMentionCountRef.current = mentionedUsers.length;
        if (mentionedUsers.length <= previousCount) return;
        const addedUser = mentionedUsers[mentionedUsers.length - 1];
        if (!addedUser) return;
        announceInteraction('user.selected', { user: addedUser.name ?? addedUser.id });
      },
    );
    return unsubscribe;
  }, [announceInteraction, textComposer.state]);

  useLayoutEffect(() => {
    // Set the text and then the range in the same effect, or the cursor resets to the end.
    const textarea = textareaRef.current;
    if (!textarea || isComposing) return;

    // The value is set here, not through a `value` prop: that would stop `compositionend` from
    // firing and block composed characters (ô), while no override at all would drop text changes
    // from middleware (e.g. replacing characters with emojis).
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
      className={clsx('rta', 'str-chat__textarea', containerClassName, {
        ['rta--loading']: isLoadingItems,
      })}
      ref={containerRef}
    >
      <Textarea
        {...{ ...additionalTextareaProps, ...restTextareaProps }}
        aria-activedescendant={activeDescendantId}
        aria-autocomplete='list'
        aria-controls={suggestionsOpen ? listboxId : undefined}
        aria-label={ariaLabel}
        className={clsx(
          'rta__textarea',
          'str-chat__textarea__textarea str-chat__message-textarea',
          className,
        )}
        data-testid='message-input'
        disabled={!enabled || !!cooldownRemaining}
        maxRows={autosizeRows ?? maxRows}
        minRows={autosizeRows ?? minRows}
        onBlur={onBlur}
        onChange={changeHandler}
        onCompositionEnd={onCompositionEnd}
        onCompositionStart={onCompositionStart}
        onKeyDown={keyDownHandler}
        onPaste={onPaste}
        onScroll={scrollHandler}
        onSelect={setSelection}
        placeholder={placeholder}
        ref={(ref) => {
          textareaRef.current = ref;
        }}
        style={textareaStyle}
      />
      {/* todo: X document the layout change for the accessibility purpose (tabIndex) */}
      {!isComposing && (
        <AutocompleteSuggestionList
          className={listClassName}
          closeOnClickOutside={closeSuggestionsOnClickOutside}
          focusedItemIndex={focusedItemIndex}
          listboxId={listboxId}
          setFocusedItemIndex={setFocusedItemIndex}
        />
      )}
    </div>
  );
};
