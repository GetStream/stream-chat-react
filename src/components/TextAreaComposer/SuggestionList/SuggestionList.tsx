import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { CommandItem } from './CommandItem';
import { EmoticonItem } from './EmoticonItem';
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
import type { SuggestionItemProps } from './SuggestionListItem';

export type SuggestionListProps = Partial<{
  SuggestionItem: React.ComponentType<SuggestionItemProps>;
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

export const defaultComponents = {
  '/': CommandItem,
  ':': EmoticonItem,
  '@': UserItem,
};

export const SuggestionList = ({
  className,
  closeOnClickOutside = true,
  containerClassName,
  focusedItemIndex,
  setFocusedItemIndex,
}: SuggestionListProps) => {
  const { AutocompleteSuggestionItem = DefaultSuggestionListItem } =
    useComponentContext();
  const messageComposer = useMessageComposer();
  const { textComposer } = messageComposer;
  const { suggestions } = useStateStore(textComposer.state, textComposerStateSelector);
  const { items } =
    useStateStore(suggestions?.searchSource.state, searchSourceStateSelector) ?? {};
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  // @ts-expect-error component type mismatch
  const component = suggestions?.trigger && defaultComponents[suggestions?.trigger];

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
