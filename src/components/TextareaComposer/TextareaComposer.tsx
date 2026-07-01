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
 * Announces composer-mode changes (e.g. activating the `/giphy` command) via
 * `useAriaLiveAnnouncer`. The live region itself is provided by the nearest
 * {@link AriaLiveOutlet} – the root outlet mounted at `Chat`, or a modal outlet
 * when the composer is rendered inside an `aria-modal` dialog (assistive
 * technologies suppress live regions outside an active modal subtree, so the
 * modal outlet ensures announcements land inside the active scope).
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
    handleSubmit,
    maxRows: maxRowsContext,
    minRows: minRowsContext,
    onPaste,
    shouldSubmit: shouldSubmitContext,
    textareaRef,
  } = useMessageComposerContext();
  const cooldownRemaining = useCooldownRemaining();

  const { t } = useTranslationContext('TextareaComposer');
  const placeholder = useTextareaPlaceholder({ placeholder: placeholderProp });
  const announce = useAriaLiveAnnouncer();
  const { announceInteraction } = useInteractionAnnouncements();

  const maxRows = maxRowsProp ?? maxRowsContext ?? 10;
  const minRows = minRowsProp ?? minRowsContext;

  const shouldSubmit = shouldSubmitProp ?? shouldSubmitContext ?? defaultShouldSubmit;

  const messageComposer = useMessageComposerController();
  const { textComposer } = messageComposer;
  const { selection, suggestions, text } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  // Explicit, stable accessible name for the textarea. Naming the field explicitly
  // prevents it from inheriting an unrelated name from an ancestor (e.g. the
  // "Channels, tab panel" of the ChatView tabpanel) via accessible-name computation.
  // While the field is empty we expose the visible placeholder as the name so the
  // announced name matches what the user sees. Once the field has content we switch
  // to a stable label instead of the placeholder, which may be a command-specific
  // template (e.g. mention/command args) that would otherwise be re-announced as a
  // stale name even though the field already holds real content.
  const ariaLabel = text ? t('aria/Message input') : placeholder;

  // react-textarea-autosize can measure placeholder content as multi-line in narrow layouts,
  // producing an inflated initial height (e.g. 2 rows) before the user types.
  // Clamp to a single row only while empty unless the integrator explicitly set minRows.
  const autosizeRows = !text && minRows == null ? 1 : undefined;
  const textareaStyle = text
    ? undefined
    : ({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      } satisfies React.CSSProperties);

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
  // Whether the active option was reached via keyboard navigation (Arrow keys) within the
  // current suggestion session. Filtering resets `focusedItemIndex` to 0 on every keystroke,
  // so if we always exposed `aria-activedescendant` the screen reader would re-read the first
  // option on each character typed. We therefore expose the active option to AT ONLY after the
  // user actually navigates, and clear it again as soon as they type (see `changeHandler`).
  // While typing, the debounced polite count ("N suggestions") conveys that results changed.
  const [activeOptionFromKeyboard, setActiveOptionFromKeyboard] = useState(false);

  // Autocomplete wiring. The suggestion list is exposed as a `listbox` whose active
  // `option` this field tracks. We deliberately do NOT set `role="combobox"`/`aria-expanded`
  // here: ARIA-in-HTML disallows the `combobox` role on a multiline `<textarea>` (and
  // `aria-expanded` is not a supported attribute on the implicit `textbox` role), so axe
  // rejects them. Instead we use the `aria-activedescendant` autocomplete pattern that IS
  // valid on a textbox — `aria-autocomplete="list"` + `aria-controls` → the listbox +
  // `aria-activedescendant` → the active option — which screen readers voice on navigation.
  //
  // `aria-controls` is set whenever the list is open (so the listbox is discoverable) but
  // `aria-activedescendant` is set only once the user has navigated with the keyboard — so the
  // SR announces an option on Arrow nav, not the auto-reset first option on every keystroke.
  // Both never dangle: "open" mirrors the keyboard-navigation gate below (`suggestions` present
  // + at least one loaded item), which is also what `SuggestionList` renders on. The shared
  // `listboxId` is owned here because the relationship attributes live on the textarea; it is
  // passed down to the list, which derives per-option ids as `{listboxId}-option-{index}`.
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
      // Typing re-filters the list and resets the highlight to the first item; stop exposing
      // the active option to AT until the user navigates again, so the SR does not re-read the
      // first option on every keystroke.
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

      // use the textarea value directly as the composer state is a step behind
      const textareaValue = textareaRef.current?.value ?? event.currentTarget.value;

      if (
        textComposer.suggestions &&
        textComposer.suggestions.searchSource.items?.length
      ) {
        if (event.key === 'Escape') return textComposer.closeSuggestions();
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
      } else if (
        shouldSubmit(event) &&
        textareaRef.current &&
        messageComposer.hasSendableData
      ) {
        if (event.key === 'Enter') {
          // prevent adding newline when submitting a message with
          event.preventDefault();
        }
        handleSubmit();
      }
    },
    [
      focusedItemIndex,
      handleSubmit,
      messageComposer,
      onKeyDown,
      shouldSubmit,
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

  // Announce textarea-mode changes (e.g. activating the `/giphy` command) over
  // the polite live region when the textarea is already focused at the moment
  // the command activates.
  //
  // When focus is elsewhere (e.g. on a command menu item or a suggestion list
  // item that calls `textareaRef.current.focus()` right after selecting the
  // command), the subsequent focus shift to the textarea is what causes
  // assistive tech to re-announce the field with its new accessible name –
  // announcing here too would duplicate the message.
  //
  // We subscribe to the state store synchronously rather than via
  // `useStateStore` + `useEffect` so that the `document.activeElement` check
  // runs before any `focus()` call that follows `textComposer.handleSelect`
  // inside the same event handler (e.g. mouse-click on a suggestion item).
  //
  // The announcement itself is deferred to `requestAnimationFrame` so the
  // textarea DOM node already reflects the command-specific placeholder /
  // `aria-label` produced by the React render that follows this state change.
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

  // Announce a one-shot confirmation when a user is picked from the @-mention
  // autocomplete. Fire only when a *new* user is appended, so unrelated state
  // changes (text edits, command activation, removing a mention) do not re-trigger.
  //
  // Dedupe against a component-instance ref rather than `subscribeWithSelector`'s
  // per-call `previous`: the listener can be invoked more than once for a single
  // selection, and `previous` is per-invocation, so two calls both see growth and
  // announce twice. The shared ref makes the second call observe the already-updated
  // count and skip — at most one announcement per selection.
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
