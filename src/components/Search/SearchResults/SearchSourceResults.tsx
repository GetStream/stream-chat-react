import React from 'react';
import { SearchSourceEmptyResults as DefaultSearchSourceEmptyResults } from './SearchSourceEmptyResults';
import { SearchSourceResultsError as DefaultSearchSourceResultsError } from './SearchSourceResultsError';
import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultSearchSources, SearchSource, SearchSourceState } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isLoading: nextValue.isLoading,
  items: nextValue.items,
  lastQueryError: nextValue.lastQueryError,
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
    SearchSourceResultsError = DefaultSearchSourceResultsError,
    SearchSourceResultList = DefaultSearchSourceResultList,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { isLoading, items, lastQueryError } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  return !items && !isLoading ? null : (
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
