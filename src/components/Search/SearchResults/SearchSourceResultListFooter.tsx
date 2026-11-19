import React from 'react';
import type { SearchSourceState } from 'stream-chat';

import {
  SearchSourceResultsEndReached,
  SearchSourceResultsFirstPageLoading,
  SearchSourceResultsLoadingNextPage,
} from './ListStates';
import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import { renderWithDeprecatedKey } from '../../ListStates/utils';
import { useComponentContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (value: SearchSourceState) => ({
  hasNext: value.hasNext,
  isLoading: value.isLoading,
  isLoadingFirstPage: value.isLoading && !value.items?.length,
});

/**
 * The end of a search source's result list: the loading state while a query runs (the first page's
 * or a next page's), and the end of the results once the last page has loaded.
 */
export const SearchSourceResultListFooter = () => {
  const {
    ListEndReachedUI = SearchSourceResultsEndReached,
    ListFirstPageLoadingUI = SearchSourceResultsFirstPageLoading,
    ListLoadingNextPageUI = SearchSourceResultsLoadingNextPage,
    SearchSourceResultsLoadingIndicator,
  } = useComponentContext();
  const { searchSource } = useSearchSourceResultsContext();
  const { hasNext, isLoading, isLoadingFirstPage } = useStateStore(
    searchSource.state,
    searchSourceStateSelector,
  );

  return (
    <div
      className='str-chat__search-source-result-list__footer'
      data-testid='search-footer'
    >
      {/* The deprecated `SearchSourceResultsLoadingIndicator` is shown only while a page loads. */}
      {renderWithDeprecatedKey(
        SearchSourceResultsLoadingIndicator,
        {},
        isLoadingFirstPage ? (
          <ListFirstPageLoadingUI />
        ) : (
          <ListLoadingNextPageUI isLoading={isLoading} position='bottom' />
        ),
        isLoading,
      )}
      <ListEndReachedUI hasEnded={!isLoading && !hasNext} reached='bottom' />
    </div>
  );
};
