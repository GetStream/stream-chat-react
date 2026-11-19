import React from 'react';

import { useSearchSourceResultsContext } from '../SearchSourceResultsContext';
import type { ListEndReachedUIProps, ListLoadingNextPageUIProps } from '../../ListStates';
import { useTranslationContext } from '../../../context';

// A search source's list states: its empty state, "Searching for…" while a page loads, and "All
// results loaded" below the last page. `SearchSourceResultListFooter` renders the last three.

/** A search source without results: "No results found". */
export const SearchSourceResultsEmpty = () => {
  const { t } = useTranslationContext();
  return (
    <div className='str-chat__search-source-results-empty'>
      {t('search.sourceResults.noResultsFound.text', 'No results found')}
    </div>
  );
};

/** While a search source loads its first page: "Searching for…" with the source's type. */
export const SearchSourceResultsFirstPageLoading = () => {
  const { t } = useTranslationContext();
  const { searchSource } = useSearchSourceResultsContext();
  return (
    <div
      className='str-chat__search-source-results__loading-indicator'
      data-testid='search-loading-indicator'
    >
      {t(
        'search.sourceResults.searching.text',
        'Searching for {{ searchSourceType }}...',
        {
          searchSourceType: searchSource.type,
        },
      )}
    </div>
  );
};

/** While a search source loads a further page: "Searching for…", as for the first page. */
export const SearchSourceResultsLoadingNextPage = ({
  isLoading,
}: ListLoadingNextPageUIProps) =>
  isLoading ? <SearchSourceResultsFirstPageLoading /> : null;

/** Below the last page of a search source's results: "All results loaded". */
export const SearchSourceResultsEndReached = ({
  hasEnded,
  reached,
}: ListEndReachedUIProps) => {
  const { t } = useTranslationContext();

  if (!hasEnded || reached !== 'bottom') return null;

  return (
    // Hidden from assistive tech: `useAnnounceSearchResultCount` announces the end of the list
    // together with the result count.
    <div aria-hidden='true' className='str-chat__search-source-results---empty'>
      {t('common.resultsLoaded.label', 'All results loaded')}
    </div>
  );
};
