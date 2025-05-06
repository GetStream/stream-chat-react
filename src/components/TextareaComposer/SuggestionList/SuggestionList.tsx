import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import type { CommandItemProps } from './CommandItem';
import { CommandItem } from './CommandItem';
import type { EmoticonItemProps } from './EmoticonItem';
import { EmoticonItem } from './EmoticonItem';
import type { SuggestionListItemComponentProps } from './SuggestionListItem';
import { SuggestionListItem as DefaultSuggestionListItem } from './SuggestionListItem';
import { UserItem } from './UserItem';
import { useComponentContext } from '../../../context/ComponentContext';
import { useStateStore } from '../../../store';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useMessageComposer } from '../../MessageInput';
import type {
  SearchSourceState,
  TextComposerState,
  TextComposerSuggestion,
} from 'stream-chat';
import type { UserItemProps } from './UserItem';

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

const textComposerStateSelector = (state: TextComposerState) => ({
  suggestions: state.suggestions,
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
    <CommandItem entity={props.entity as CommandItemProps['entity']} />
  ),
  ':': (props: SuggestionListItemComponentProps) => (
    <EmoticonItem entity={props.entity as EmoticonItemProps['entity']} />
  ),
  '@': (props: SuggestionListItemComponentProps) => (
    <UserItem entity={props.entity as UserItemProps['entity']} />
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
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const component = suggestions?.trigger
    ? suggestionItemComponents[suggestions?.trigger]
    : undefined;

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

  if (!suggestions || !items?.length || !component) return null;

  return (
    <div
      className={clsx('str-chat__suggestion-list-container', containerClassName)}
      ref={setContainer}
    >
      <InfiniteScrollPaginator
        loadNextOnScrollToBottom={suggestions.searchSource.search}
        threshold={100}
      >
        <ul
          className={clsx(
            'str-chat__suggestion-list str-chat__suggestion-list--react',
            className,
          )}
        >
          {items.map((item, i) => (
            <AutocompleteSuggestionItem
              component={component}
              focused={focusedItemIndex === i}
              item={item}
              key={item.id.toString()}
              onMouseEnter={() => setFocusedItemIndex?.(i)}
            />
          ))}
        </ul>
      </InfiniteScrollPaginator>
    </div>
  );
};
