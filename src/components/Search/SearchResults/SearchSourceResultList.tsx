import { useSearchContext, useTranslationContext } from '../../../context';
import React, { ComponentType, useCallback } from 'react';
import { InfiniteScrollPaginator } from '../../InfiniteScrollPaginator/InfiniteScrollPaginator';
import { DefaultSearchResultItems, SearchResultItemComponents } from './SearchResultItem';
import type { DefaultSearchSources, SearchSource, SourceItemsRecord } from '../SearchController';

export type SearchSourceResultListProps<Sources extends SearchSource[] = DefaultSearchSources> = {
  items: SourceItemsRecord<Sources>[Sources[number]['type']];
  searchSource: Sources[number]['type'];
  lastQueryError?: Error;
  SearchResultItems?: SearchResultItemComponents<Sources>;
};

export const SearchSourceResultList = <Sources extends SearchSource[] = DefaultSearchSources>({
  items,
  lastQueryError,
  searchSource,
  SearchResultItems = DefaultSearchResultItems as SearchResultItemComponents<Sources>,
}: SearchSourceResultListProps<Sources>) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<Sources>();
  const loadMore = useCallback(() => searchController.loadMoreSource(searchSource), [
    searchController,
    searchSource,
  ]);
  const SearchResultItem = SearchResultItems[searchSource] as ComponentType<{ item: unknown }>;

  if (!SearchResultItem) return null;

  return (
    <InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
      <div className='str-chat__source-search-results_list'>
        {lastQueryError && (
          <div className='str-chat__source-search-results_list'>
            {t<string>(lastQueryError.message)}
          </div>
        )}
        {items.map((item, i) => (
          <SearchResultItem item={item} key={`source-search-result-${searchSource}-${i}`} />
        ))}
      </div>
    </InfiniteScrollPaginator>
  );
};
