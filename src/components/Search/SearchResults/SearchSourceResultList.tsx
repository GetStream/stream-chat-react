import React, { ComponentType, useCallback } from 'react';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import { SearchSourceLoadingResults as DefaultSearchSourceLoadingResults } from './SearchSourceLoadingResults';
import { useComponentContext } from '../../../context';
import type { DefaultSearchSources, SearchSource, SourceItemsRecord } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

export type SearchSourceResultListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  searchSource: Sources[number];
  isLoading?: boolean;
  items?: SourceItemsRecord<StreamChatGenerics, Sources>[Sources[number]['type']];
  SearchResultItems?: SearchResultItemComponents<Sources>;
};

export const SearchSourceResultList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  isLoading,
  items,
  searchSource,
  SearchResultItems = DefaultSearchResultItems as SearchResultItemComponents<SearchSources>,
}: SearchSourceResultListProps<StreamChatGenerics, SearchSources>) => {
  const { SearchSourceLoadingResults = DefaultSearchSourceLoadingResults } = useComponentContext<
    StreamChatGenerics,
    NonNullable<unknown>,
    SearchSources
  >();
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
      </InfiniteScrollPaginator>
    </div>
  );
};
