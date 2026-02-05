import clsx from 'clsx';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import type { CommandItemProps } from './CommandItem';
import { CommandItem } from './CommandItem';
import type { EmoticonItemProps } from './EmoticonItem';
import { EmoticonItem } from './EmoticonItem';
import type { SuggestionListItemComponentProps } from './SuggestionListItem';
import { SuggestionListItem as DefaultSuggestionListItem } from './SuggestionListItem';
import type { UserItemProps } from './UserItem';
import { UserItem } from './UserItem';
import { useComponentContext } from '../../../context/ComponentContext';
import { useMessageInputContext } from '../../../context/MessageInputContext';
import { useStateStore } from '../../../store';
import { getTextareaCaretRect } from '../../../utils/getTextareaCaretRect';
import type { ContextMenuItemComponent, ContextMenuItemProps } from '../../Dialog';
import { ContextMenu } from '../../Dialog';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useMessageComposer } from '../../MessageInput';
import type {
  SearchSourceState,
  TextComposerState,
  TextComposerSuggestion,
} from 'stream-chat';

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
    <UserItem {...props} entity={props.entity as UserItemProps['entity']} />
  ),
} as const;

export const SuggestionList = ({
  className,
  closeOnClickOutside = true,
  containerClassName,
  focusedItemIndex,
  setFocusedItemIndex,
  suggestionItemComponents = defaultComponents,
}: SuggestionListProps) => {
  const { AutocompleteSuggestionItem = DefaultSuggestionListItem } =
    useComponentContext();
  const { textareaRef } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { selection, suggestions } = useStateStore(
    textComposer.state,
    textComposerStateSelector,
  );
  const { items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>();

  const component = suggestions?.trigger
    ? suggestionItemComponents[suggestions?.trigger]
    : undefined;

  const contextMenuItems = useMemo<ContextMenuItemComponent[]>(() => {
    if (!component) return [];
    return (items ?? []).map((item, i) => {
      const Item: ContextMenuItemComponent = ({
        closeMenu: _, // eslint-disable-line @typescript-eslint/no-unused-vars
        openSubmenu: __, //eslint-disable-line @typescript-eslint/no-unused-vars
        ...props
      }: ContextMenuItemProps) => (
        <AutocompleteSuggestionItem
          {...props}
          component={component}
          focused={focusedItemIndex === i}
          item={item}
          key={item.id.toString()}
          onMouseEnter={() => setFocusedItemIndex?.(i)}
        />
      );
      return Item;
    });
  }, [
    items,
    component,
    focusedItemIndex,
    setFocusedItemIndex,
    AutocompleteSuggestionItem,
  ]);

  const ItemsWrapper = useCallback(
    ({ children }: React.ComponentProps<'div'>) => (
      <InfiniteScrollPaginator
        loadNextOnScrollToBottom={suggestions?.searchSource.search}
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

  const updatePosition = useCallback(() => {
    const rect = getTextareaCaretRect(textareaRef.current ?? null, selection?.end);
    if (!rect) {
      setContainerStyle((prev) => (prev ? undefined : prev));
      return;
    }
    const containerWidth = container?.getBoundingClientRect().width ?? 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const shouldFlipX = containerWidth > 0 && rect.left + containerWidth > viewportWidth;
    const left = shouldFlipX ? Math.max(0, rect.left - containerWidth) : rect.left;
    const top = rect.top - 8;
    setContainerStyle((prev) => {
      if (prev && prev.left === left && prev.top === top) return prev;
      return {
        bottom: 'auto',
        left,
        position: 'fixed',
        top,
        transform: 'translateY(-100%)',
        zIndex: 1000,
      };
    });
  }, [container, selection?.end, textareaRef]);

  useLayoutEffect(() => {
    if (!suggestions) return;
    updatePosition();
  }, [items?.length, suggestions, updatePosition]);

  useEffect(() => {
    if (!suggestions) return;
    const textarea = textareaRef.current;
    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    textarea?.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
      textarea?.removeEventListener('scroll', handleScroll);
    };
  }, [suggestions, textareaRef, updatePosition]);

  if (!suggestions || !items?.length || !component) return null;

  return (
    <div
      className={clsx('str-chat__suggestion-list-container', containerClassName)}
      ref={setContainer}
      style={containerStyle}
    >
      <ContextMenu
        className={clsx('str-chat__suggestion-list', className)}
        items={contextMenuItems}
        ItemsWrapper={ItemsWrapper}
      />
    </div>
  );
};
