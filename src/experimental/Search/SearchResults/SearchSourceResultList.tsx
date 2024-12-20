import React, { ComponentType, useCallback } from 'react';
import { InfiniteScrollPaginator } from '../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import { SearchSourceResultListFooter as DefaultSearchSourceResultListFooter } from './SearchSourceResultListFooter';
import { useComponentContext } from '../../../context';
import type { DefaultSearchSources, SearchSource, SourceItemsRecord } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceResultListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchSource: SearchSource;
  items?: SourceItemsRecord<StreamChatGenerics, Sources>[Sources[number]['type']];
  loadMoreDebounceMs?: number;
  loadMoreThresholdPx?: number;
  SearchResultItems?: SearchResultItemComponents<Sources>;
};

export const SearchSourceResultList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  items,
  loadMoreThresholdPx = 80,
  loadMoreDebounceMs = 100,
  searchSource,
  SearchResultItems = DefaultSearchResultItems as SearchResultItemComponents<SearchSources>,
}: SearchSourceResultListProps<StreamChatGenerics, SearchSources>) => {
  const {
    SearchSourceResultListFooter = DefaultSearchSourceResultListFooter,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
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
        <SearchSourceResultListFooter searchSource={searchSource} />
      </InfiniteScrollPaginator>
    </div>
  );
};
