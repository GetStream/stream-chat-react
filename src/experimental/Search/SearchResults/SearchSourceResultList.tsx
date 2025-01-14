import React, { ComponentType } from 'react';

import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import { SearchSourceResultListFooter as DefaultSearchSourceResultListFooter } from './SearchSourceResultListFooter';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { InfiniteScrollPaginator } from '../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchSourceState, SearchSourceType } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  items: nextValue.items,
});

export type SearchSourceResultListProps = {
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
  SearchResultItems?: SearchResultItemComponents;
};

export const SearchSourceResultList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  loadMoreThresholdPx = 80,
  loadMoreDebounceMs = 100,
  SearchResultItems = DefaultSearchResultItems,
}: SearchSourceResultListProps) => {
  const {
    SearchSourceResultListFooter = DefaultSearchSourceResultListFooter,
  } = useComponentContext<StreamChatGenerics>();

  const { searchSource } = useSearchSourceResultsContext();
  const { items } = useStateStore(searchSource.state, searchSourceStateSelector);

  const SearchResultItem = SearchResultItems[
    searchSource.type as SearchSourceType
  ] as ComponentType<{ item: unknown }>;

  if (!SearchResultItem) return null;

  return (
    <div className='str-chat__search-source-result-list'>
      <InfiniteScrollPaginator
        loadNextDebounceMs={loadMoreDebounceMs}
        loadNextOnScrollToBottom={searchSource.search}
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
