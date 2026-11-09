import clsx from 'clsx';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { VirtualElement } from '@floating-ui/react';
import type { CommandItemProps } from './CommandItem';
import { CommandItem } from './CommandItem';
import type { EmoticonItemProps } from './EmoticonItem';
import { EmoticonItem } from './EmoticonItem';
import { MentionItem } from './MentionItem';
import type { SuggestionListItemComponentProps } from './SuggestionListItem';
import { SuggestionListItem as DefaultSuggestionListItem } from './SuggestionListItem';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useComponentContext } from '../../../context/ComponentContext';
import { useMessageComposerContext } from '../../../context/MessageComposerContext';
import { useStateStore } from '../../../store';
import { useStableId } from '../../UtilityComponents/useStableId';
import { getTextareaCaretRect } from '../../../utils/getTextareaCaretRect';
import type { ContextMenuItemComponent, ContextMenuItemProps } from '../../Dialog';
import { ContextMenu } from '../../Dialog';
import { usePopoverPosition } from '../../Dialog/hooks/usePopoverPosition';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import {
  useMessageComposerCommands,
  useMessageComposerController,
} from '../../MessageComposer/hooks';
import { useTranslationContext } from '../../../context';
import type {
  MentionSuggestion,
  SearchSourceState,
  TextComposerState,
  TextComposerSuggestion,
} from 'stream-chat';
import {
  CommandsMenuClassName,
  CommandsMenuHeader,
} from '../../MessageComposer/AttachmentSelector/CommandsMenu';

type SuggestionTrigger = '/' | ':' | '@' | string;

export type SuggestionListProps = Partial<{
  suggestionItemComponents: Record<
    SuggestionTrigger,
    React.ComponentType<SuggestionListItemComponentProps>
  >;
  className?: string;
  closeOnClickOutside?: boolean;
  containerClassName?: string;
  focusedItemIndex: number;
  /**
   * ID of the listbox element. The textarea's `aria-controls` and `aria-activedescendant` point at
   * it and at the option IDs (`{listboxId}-option-{index}`), so the textarea and the list must
   * share it. Defaults to a generated stable ID.
   */
  listboxId?: string;
  setFocusedItemIndex: (index: number) => void;
}>;

const textComposerStateSelector = ({ selection, suggestions }: TextComposerState) => ({
  selection,
  suggestions,
});

const searchSourceStateSelector = (
  nextValue: SearchSourceState<TextComposerSuggestion>,
): { items: TextComposerSuggestion[] } => ({
  items: nextValue.items ?? [],
});

export const defaultComponents: Record<
  SuggestionTrigger,
  React.ComponentType<SuggestionListItemComponentProps>
> = {
  '/': (props: SuggestionListItemComponentProps) => (
    <CommandItem {...props} entity={props.entity as CommandItemProps['entity']} />
  ),
  ':': (props: SuggestionListItemComponentProps) => (
    <EmoticonItem {...props} entity={props.entity as EmoticonItemProps['entity']} />
  ),
  '@': (props: SuggestionListItemComponentProps) => (
    <MentionItem {...props} entity={props.entity as MentionSuggestion} />
  ),
} as const;

/**
 * Whether the suggestion listbox is shown for a source: command suggestions are hidden when every
 * command is disabled. Shared with `TextareaComposer` so its `aria-controls` and
 * `aria-activedescendant` are set only while the listbox is rendered.
 *
 * @param params.commands - Commands of the channel.
 * @param params.type - Type of the active search source.
 * @returns False for the `commands` source when no command is enabled, otherwise true.
 */
export const hasEnabledCommandSuggestions = ({
  commands,
  type,
}: {
  commands: Array<{ enabled?: boolean }>;
  type?: string;
}) => type !== 'commands' || commands.some((command) => command.enabled);

export const SuggestionList = ({
  className,
  closeOnClickOutside = true,
  containerClassName,
  focusedItemIndex,
  listboxId,
  setFocusedItemIndex,
  suggestionItemComponents = defaultComponents,
}: SuggestionListProps) => {
  const { t } = useTranslationContext();
  const generatedListboxId = useStableId();
  const resolvedListboxId = listboxId ?? generatedListboxId;
  const { announceInteraction } = useInteractionAnnouncements();
  const {
    AutocompleteSuggestionItem = DefaultSuggestionListItem,
    ContextMenu: ContextMenuComponent = ContextMenu,
  } = useComponentContext();
  const { textareaRef } = useMessageComposerContext();
  const messageComposer = useMessageComposerController();
  const commands = useMessageComposerCommands();
  const { textComposer } = messageComposer;
  const { selection, suggestions } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  const { items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const commandSuggestionsEnabled = useMemo(
    () =>
      hasEnabledCommandSuggestions({ commands, type: suggestions?.searchSource.type }),
    [commands, suggestions?.searchSource.type],
  );

  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const caretRectRef = useRef<DOMRect | null>(null);
  const virtualCaretReference = useMemo<VirtualElement>(
    () => ({
      getBoundingClientRect: () => caretRectRef.current ?? new DOMRect(),
    }),
    [],
  );

  const { refs, strategy, update, x, y } = usePopoverPosition({
    allowFlip: false,
    offset: 8,
    placement: 'top-start',
    // For top placements the cross axis is Y: with flipping off, this shifts the list back into
    // view vertically when it overflows the top edge.
    shiftOptions: { crossAxis: true },
  });

  const component = suggestions?.trigger
    ? suggestionItemComponents[suggestions?.trigger]
    : undefined;

  const contextMenuItems = useMemo<ContextMenuItemComponent[]>(() => {
    if (!component) return [];
    // Rendered in the search source's own order, which the composer's Enter handler also indexes,
    // so the highlighted option is the inserted one.
    return (items ?? []).map((item, i) => {
      const Item: ContextMenuItemComponent = ({ ...props }: ContextMenuItemProps) => (
        <AutocompleteSuggestionItem
          {...props}
          aria-selected={focusedItemIndex === i}
          component={component}
          focused={focusedItemIndex === i}
          id={`${resolvedListboxId}-option-${i}`}
          item={item}
          key={item.id.toString()}
          onMouseEnter={() => setFocusedItemIndex?.(i)}
          role='option'
        />
      );
      return Item;
    });
  }, [
    items,
    component,
    focusedItemIndex,
    resolvedListboxId,
    setFocusedItemIndex,
    AutocompleteSuggestionItem,
  ]);

  const ItemsWrapper = useCallback(
    ({ children }: React.ComponentProps<'div'>) => (
      <InfiniteScrollPaginator
        contentProps={{ role: 'presentation' }}
        loadNextOnScrollToBottom={suggestions?.searchSource.search}
        role='presentation'
        threshold={100}
      >
        {children}
      </InfiniteScrollPaginator>
    ),
    [suggestions?.searchSource.search],
  );

  useEffect(() => {
    if (!closeOnClickOutside || !suggestions || !container) return;
    const handleClick = (event: MouseEvent) => {
      if (container.contains(event.target as Node)) return;
      textComposer.closeSuggestions();
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [closeOnClickOutside, suggestions, container, textComposer]);

  useEffect(() => {
    refs.setFloating(container);
  }, [container, refs]);

  useLayoutEffect(() => {
    if (!suggestions || !update) return;
    const updatePosition = () => {
      const rect = getTextareaCaretRect(textareaRef.current ?? null, selection?.end);
      if (!rect) {
        caretRectRef.current = null;
        refs.setReference(null);
        return;
      }
      caretRectRef.current = rect;
      virtualCaretReference.contextElement = textareaRef.current ?? undefined;
      refs.setReference(virtualCaretReference);
      update();
    };

    updatePosition();
  }, [
    container,
    items?.length,
    refs,
    selection?.end,
    suggestions,
    textareaRef,
    update,
    virtualCaretReference,
  ]);

  const showSuggestionsList = !!(
    suggestions &&
    items?.length &&
    component &&
    commandSuggestionsEnabled
  );

  // One label per suggestion type, used as the listbox's aria-label and in the count announcement.
  // The cases must match the search source `type` values: `commands` and `mentions` are plural, but
  // the emoji source uses the singular `emoji`. A mismatch falls through to the generic label.
  const suggestionMenuLabel = useMemo(() => {
    switch (suggestions?.searchSource.type) {
      case 'commands':
        return t(
          'textareaComposer.suggestionList.commandSuggestions.ariaLabel',
          'Command Suggestions',
        );
      case 'emoji':
        return t(
          'textareaComposer.suggestionList.emojiSuggestions.ariaLabel',
          'Emoji Suggestions',
        );
      case 'mentions':
        return t(
          'textareaComposer.suggestionList.mentionSuggestions.ariaLabel',
          'Mention Suggestions',
        );
      default:
        return t('textareaComposer.suggestionList.suggestions.ariaLabel', 'Suggestions');
    }
  }, [suggestions?.searchSource.type, t]);

  // Announces the result count when the menu appears and on every re-filter. It depends on `items`,
  // not their number, because emoji results are capped at a constant count and typing would
  // otherwise go silent. `suggestions.count` debounces for 500 ms, so continuous typing yields one
  // announcement. Nothing is announced while the list is hidden.
  useEffect(() => {
    if (!showSuggestionsList) return;
    announceInteraction('suggestions.count', {
      count: items?.length ?? 0,
      suggestionsLabel: suggestionMenuLabel,
    });
  }, [announceInteraction, items, showSuggestionsList, suggestionMenuLabel]);

  if (!showSuggestionsList) return null;

  return (
    <div
      aria-label={suggestionMenuLabel}
      className={clsx('str-chat__suggestion-list-container', containerClassName)}
      id={resolvedListboxId}
      ref={setContainer}
      role='listbox'
      style={{
        left: x ?? 0,
        position: strategy,
        top: y ?? 0,
        visibility: x == null || y == null ? 'hidden' : undefined,
        zIndex: 1000,
      }}
    >
      <ContextMenuComponent
        className={clsx('str-chat__suggestion-list', className)}
        Header={
          suggestions.searchSource.type === 'commands' ? CommandsMenuHeader : undefined
        }
        items={contextMenuItems}
        ItemsWrapper={ItemsWrapper}
        menuClassName={
          suggestions.searchSource.type === 'commands' ? CommandsMenuClassName : undefined
        }
        role='presentation'
      />
    </div>
  );
};
