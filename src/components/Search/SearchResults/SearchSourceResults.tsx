import React, { useCallback } from 'react';
import { SearchSourceEmptyResults } from './SearchSourceEmptyResults';
import { SearchSourceLoadingResults } from './SearchSourceLoadingResults';
import { PresearchSourceSearchResults } from './PresearchSourceSearchResults';
import { SearchSourceResultList } from './SearchSourceResultList';
import { DefaultSearchSources, SearchControllerState, SearchSource } from '../SearchController';
import { useStateStore } from '../../../store';
import { useSearchContext } from '../../../context';

export type SearchSourceResultsProps<Sources extends SearchSource[] = DefaultSearchSources> = {
  searchSource: Sources[number]['type'];
};

export const SearchSourceResults = <Sources extends SearchSource[] = DefaultSearchSources>({
  searchSource,
}: SearchSourceResultsProps<Sources>) => {
  const { searchController } = useSearchContext<Sources>();

  const searchControllerStateSelector = useCallback(
    (nextValue: SearchControllerState<Sources>) => ({
      isLoading: nextValue.queryInProgress.findIndex((s) => s === searchSource) > -1,
      items: nextValue.items[searchSource],
    }),
    [searchSource],
  );

  const { isLoading, items } = useStateStore(searchController.state, searchControllerStateSelector);

  if (isLoading) {
    return <SearchSourceLoadingResults searchSource={searchSource} />;
  }

  if (!Array.isArray(items)) {
    return <PresearchSourceSearchResults searchSource={searchSource} />;
  }

  if (items.length === 0) {
    return <SearchSourceEmptyResults searchSource={searchSource} />;
  }

  return (
    <SearchSourceResultList
      items={items}
      lastQueryError={searchController.sourceLastQueryError(searchSource)}
      searchSource={searchSource}
    />
  );
};
