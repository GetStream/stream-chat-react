import React from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import { SearchSourceResultList as DefaultSearchSourceResultList } from './SearchSourceResultList';
import { SearchSourceResultsEmpty as DefaultSearchSourceResultsEmpty } from './ListStates';
import { SearchSourceResultsHeader as DefaultSearchSourceResultsHeader } from './SearchSourceResultsHeader';
import { SearchSourceResultsContextProvider } from '../SearchSourceResultsContext';
import { useSearchSourceFirstPageLoadRetry } from '../hooks/useSearchSourceFirstPageLoadRetry';
import { ListLoadErrorUI as DefaultListLoadErrorUI } from '../../ListStates';
import { renderWithDeprecatedKey } from '../../ListStates/utils';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isLoading: nextValue.isLoading,
  items: nextValue.items,
});

export type SearchSourceResultsProps = { searchSource: SearchSource };

export const SearchSourceResults = ({ searchSource }: SearchSourceResultsProps) => {
  const {
    ListEmptyUI = DefaultSearchSourceResultsEmpty,
    ListLoadErrorUI = DefaultListLoadErrorUI,
    SearchSourceResultList = DefaultSearchSourceResultList,
    SearchSourceResultsEmpty,
    SearchSourceResultsHeader = DefaultSearchSourceResultsHeader,
  } = useComponentContext();
  const { isLoading, items } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  const firstPageLoadRetry = useSearchSourceFirstPageLoadRetry(searchSource);

  // A source that has not searched yet shows nothing.
  if (!items && !isLoading && !firstPageLoadRetry.error) return null;

  return (
    <SearchSourceResultsContextProvider value={{ searchSource }}>
      <div
        className='str-chat__search-source-results'
        data-testid='search-source-results'
      >
        <SearchSourceResultsHeader />
        {/* A failed first page shows its error in place of the results. The list shows a running
            query in its footer; the deprecated empty key wins while set. */}
        {firstPageLoadRetry.error ? (
          <ListLoadErrorUI
            error={firstPageLoadRetry.error}
            isRetrying={firstPageLoadRetry.isRetrying}
            retry={firstPageLoadRetry.retry}
          />
        ) : items?.length || isLoading ? (
          <SearchSourceResultList />
        ) : (
          renderWithDeprecatedKey(SearchSourceResultsEmpty, {}, <ListEmptyUI />)
        )}
      </div>
    </SearchSourceResultsContextProvider>
  );
};
