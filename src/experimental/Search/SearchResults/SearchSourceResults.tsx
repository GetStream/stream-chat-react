import React from 'react';
import { SearchSourceEmptyResults as DefaultSearchSourceEmptyResults } from './SearchSourceEmptyResults';
import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  hasMore: nextValue.hasMore,
  isLoading: nextValue.isLoading,
  items: nextValue.items,
});

export type SearchSourceResultsProps = { searchSource: SearchSource };
export const SearchSourceResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceResultsProps) => {
  const {
    SearchSourceEmptyResults = DefaultSearchSourceEmptyResults,
    SearchSourceResultList = DefaultSearchSourceResultList,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { hasMore, isLoading, items } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  return !items && !isLoading ? null : items?.length || isLoading ? (
    <SearchSourceResultList
      hasMore={hasMore}
      isLoading={isLoading}
      items={items}
      searchSource={searchSource}
    />
  ) : (
    <SearchSourceEmptyResults searchSource={searchSource} />
  );
};
