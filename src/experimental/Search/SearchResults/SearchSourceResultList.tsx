import React, { ComponentType, useCallback } from 'react';
import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import { SearchSourceResultListFooter as DefaultSearchSourceResultListFooter } from './SearchSourceResultListFooter';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { InfiniteScrollPaginator } from '../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export type SearchSourceResultListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
  SearchResultItems?: SearchResultItemComponents<Sources>;
};

export const SearchSourceResultList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  loadMoreThresholdPx = 80,
  loadMoreDebounceMs = 100,
  SearchResultItems = DefaultSearchResultItems as SearchResultItemComponents<SearchSources>,
}: SearchSourceResultListProps<StreamChatGenerics, SearchSources>) => {
  const {
    SearchSourceResultListFooter = DefaultSearchSourceResultListFooter,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();

  const { searchSource } = useSearchSourceResultsContext();
  const { items } = useStateStore(searchSource.state, searchSourceStateSelector);

  const loadMore = useCallback(() => searchSource.search(), [searchSource]);

  const SearchResultItem = SearchResultItems[
    searchSource.type as SearchSources[number]['type']
  ] as ComponentType<{ item: unknown }>;

  if (!SearchResultItem) return null;

  return (
    <div className='str-chat__search-source-result-list'>
      <InfiniteScrollPaginator
        loadNextDebounceMs={loadMoreDebounceMs}
        loadNextOnScrollToBottom={loadMore}
        threshold={loadMoreThresholdPx}
      >
        {items?.map((item, i) => (
          <SearchResultItem item={item} key={`source-search-result-${searchSource.type}-${i}`} />
        ))}
        <SearchSourceResultListFooter />
      </InfiniteScrollPaginator>
    </div>
  );
};
