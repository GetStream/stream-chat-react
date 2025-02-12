import React from 'react';
import type { ComponentType } from 'react';
import type { SearchSourceState, SearchSourceType } from 'stream-chat';

import { DefaultSearchResultItems } from './SearchResultItem';
import { SearchSourceResultListFooter as DefaultSearchSourceResultListFooter } from './SearchSourceResultListFooter';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { InfiniteScrollPaginator } from '../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { SearchResultItemComponents } from './SearchResultItem';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export type SearchSourceResultListProps = {
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
  SearchResultItems?: SearchResultItemComponents;
};

export const SearchSourceResultList = ({
  loadMoreDebounceMs = 100,
  loadMoreThresholdPx = 80,
  SearchResultItems = DefaultSearchResultItems,
}: SearchSourceResultListProps) => {
  const { SearchSourceResultListFooter = DefaultSearchSourceResultListFooter } =
    useComponentContext();

  const { searchSource } = useSearchSourceResultsContext();
  const { items } = useStateStore(searchSource.state, searchSourceStateSelector);

  const SearchResultItem = SearchResultItems[
    searchSource.type as SearchSourceType
  ] as ComponentType<{ item: unknown }>;

  if (!SearchResultItem) return null;

  return (
    <div
      className='str-chat__search-source-result-list'
      data-testid='search-source-result-list'
    >
      <InfiniteScrollPaginator
        loadNextDebounceMs={loadMoreDebounceMs}
        loadNextOnScrollToBottom={searchSource.search}
        threshold={loadMoreThresholdPx}
      >
        {items?.map((item, i) => (
          <SearchResultItem
            item={item}
            key={`source-search-result-${searchSource.type}-${i}`}
          />
        ))}
        <SearchSourceResultListFooter />
      </InfiniteScrollPaginator>
    </div>
  );
};
