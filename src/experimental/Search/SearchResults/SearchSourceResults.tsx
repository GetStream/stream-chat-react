import React from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { SearchSourceResultsEmpty as DefaultSearchSourceResultsEmpty } from './SearchSourceResultsEmpty';
import { SearchSourceResultsHeader as DefaultSearchSourceResultsHeader } from './SearchSourceResultsHeader';
import { SearchSourceResultsContextProvider } from '../SearchSourceResultsContext';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isLoading: nextValue.isLoading,
  items: nextValue.items,
});

export type SearchSourceResultsProps = { searchSource: SearchSource };

export const SearchSourceResults = ({ searchSource }: SearchSourceResultsProps) => {
  const {
    SearchSourceResultList = DefaultSearchSourceResultList,
    SearchSourceResultsEmpty = DefaultSearchSourceResultsEmpty,
    SearchSourceResultsHeader = DefaultSearchSourceResultsHeader,
  } = useComponentContext();
  const { isLoading, items } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  if (!items && !isLoading) return null;

  return (
    <SearchSourceResultsContextProvider value={{ searchSource }}>
      <div
        className='str-chat__search-source-results'
        data-testid='search-source-results'
      >
        <SearchSourceResultsHeader />
        {items?.length || isLoading ? (
          <SearchSourceResultList />
        ) : (
          <SearchSourceResultsEmpty />
        )}
      </div>
    </SearchSourceResultsContextProvider>
  );
};
