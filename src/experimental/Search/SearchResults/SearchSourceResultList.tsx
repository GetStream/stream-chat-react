import React, { ComponentType, useCallback } from 'react';
import { InfiniteScrollPaginator } from '../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import { SearchSourceLoadingResults as DefaultSearchSourceLoadingResults } from './SearchSourceLoadingResults';
import { SearchSourceResultListEnd as DefaultSearchSourceResultListEnd } from './SearchSourceResultListEnd';
import { useComponentContext } from '../../../context';
import type { DefaultSearchSources, SearchSource, SourceItemsRecord } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceResultListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  hasMore: boolean;
  searchSource: SearchSource;
  isLoading?: boolean;
  items?: SourceItemsRecord<StreamChatGenerics, Sources>[Sources[number]['type']];
  SearchResultItems?: SearchResultItemComponents<Sources>;
};

export const SearchSourceResultList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  hasMore,
  isLoading,
  items,
  searchSource,
  SearchResultItems = DefaultSearchResultItems as SearchResultItemComponents<SearchSources>,
}: SearchSourceResultListProps<StreamChatGenerics, SearchSources>) => {
  const {
    SearchSourceLoadingResults = DefaultSearchSourceLoadingResults,
    SearchSourceResultListEnd = DefaultSearchSourceResultListEnd,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const loadMore = useCallback(() => searchSource.search(), [searchSource]);
  const SearchResultItem = SearchResultItems[
    searchSource.type as SearchSources[number]['type']
  ] as ComponentType<{ item: unknown }>;

  if (!SearchResultItem) return null;

  return (
    <div className='str-chat__search-source-result-list'>
      <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
        {items?.map((item, i) => (
          <SearchResultItem item={item} key={`source-search-result-${searchSource}-${i}`} />
        ))}
        {isLoading && <SearchSourceLoadingResults searchSource={searchSource} />}
        {!hasMore && <SearchSourceResultListEnd searchSource={searchSource} />}
      </InfiniteScrollPaginator>
    </div>
  );
};
