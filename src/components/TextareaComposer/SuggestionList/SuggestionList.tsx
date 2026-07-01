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
   * Id applied to the listbox element. The controlling combobox (the composer textarea)
   * points its `aria-controls`/`aria-activedescendant` at this id and at the derived
   * per-option ids (`{listboxId}-option-{index}`), so the value must be shared between
   * the textarea and this list. When omitted, a stable id is generated locally.
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
 * Whether the suggestion listbox should be considered shown for a given source.
 * For command suggestions the list is suppressed when every command is disabled.
 * Shared with {@link TextareaComposer} so the textarea's `aria-controls`/
 * `aria-activedescendant` are only set while the listbox is actually rendered
 * (otherwise they would reference a non-existent element).
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
    // For top placements, the cross-axis is X; we need this to allow flipping the list to the right when it overflows the right edge.
    shiftOptions: { crossAxis: true },
  });

  const component = suggestions?.trigger
    ? suggestionItemComponents[suggestions?.trigger]
    : undefined;

  const contextMenuItems = useMemo<ContextMenuItemComponent[]>(() => {
    if (!component) return [];
    const sortedItems =
      suggestions?.searchSource.type === 'commands'
        ? [...(items ?? [])].sort((a, b) =>
            String((a as { name?: string }).name ?? '').localeCompare(
              String((b as { name?: string }).name ?? ''),
            ),
          )
        : (items ?? []);
    return sortedItems.map((item, i) => {
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
    suggestions?.searchSource.type,
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

  // A single localized label per suggestion type, used BOTH as the listbox's aria-label and
  // in the count announcement ("5 Command Suggestions") — one source of truth, no second key.
  // NOTE: the type strings must match the SDK search-source `type` values exactly — `commands`
  // and `mentions` are plural, but the emoji source (EmojiSearchSource) uses the singular
  // `emoji`. A mismatch silently falls through to the generic "Suggestions" label.
  const suggestionMenuLabel = useMemo(() => {
    switch (suggestions?.searchSource.type) {
      case 'commands':
        return t('aria/Command Suggestions');
      case 'emoji':
        return t('aria/Emoji Suggestions');
      case 'mentions':
        return t('aria/Mention Suggestions');
      default:
        return t('aria/Suggestions');
    }
  }, [suggestions?.searchSource.type, t]);

  // Announce the visible result count to assistive technology whenever the menu appears or the
  // result set changes as the query filters. We depend on `items` (not just its length) so the
  // count re-announces on every genuine re-filter even when the number is unchanged — e.g. emoji
  // results are capped at a constant N, so without this the user would type and hear nothing
  // after the first announcement. `announceInteraction('suggestions.count')` debounces (300ms),
  // so continuous typing collapses to a single announcement once the user pauses; it no longer
  // dedupes unchanged values (that policy moved here, where "did the results actually change?"
  // is knowable). We deliberately do not announce while the list is hidden (count 0 / closed).
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
