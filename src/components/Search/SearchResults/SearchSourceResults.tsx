import React from 'react';
import { SearchSourceEmptyResults as DefaultSearchSourceEmptyResults } from './SearchSourceEmptyResults';
import { SearchSourceResultsError as DefaultSearchSourceResultsError } from './SearchSourceResultsError';
import { SearchSourceResultsPresearch as DefaultSearchSourceResultsPresearch } from './SearchSourceResultsPresearch';
import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isLoading: nextValue.isLoading,
  items: nextValue.items,
  lastQueryError: nextValue.lastQueryError,
});

export type SearchSourceResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = { searchSource: SearchSources[number] };
export const SearchSourceResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  searchSource,
}: SearchSourceResultsProps<StreamChatGenerics, SearchSources>) => {
  const {
    SearchSourceEmptyResults = DefaultSearchSourceEmptyResults,
    SearchSourceResultsError = DefaultSearchSourceResultsError,
    SearchSourceResultList = DefaultSearchSourceResultList,
    SearchSourceResultsPresearch = DefaultSearchSourceResultsPresearch,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { isLoading, items, lastQueryError } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  const isPresearchState = !searchSource.hasResults && !isLoading && !searchSource.searchQuery;

  if (isPresearchState) {
    return <SearchSourceResultsPresearch searchSource={searchSource} />;
  }

  const isBeforeFirstPageLoad = !searchSource.hasResults && !isLoading;

  if (isBeforeFirstPageLoad) return null;

  return (
    <>
      {lastQueryError && <SearchSourceResultsError error={lastQueryError} />}
      {items?.length || isLoading ? (
        <SearchSourceResultList isLoading={isLoading} items={items} searchSource={searchSource} />
      ) : (
        <SearchSourceEmptyResults searchSource={searchSource} />
      )}
    </>
  );
};
