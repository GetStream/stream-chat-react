import React, { useRef } from 'react';
import type { SearchControllerState } from 'stream-chat';

import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { SearchResultsPresearch as DefaultSearchResultsPresearch } from './SearchResultsPresearch';
import { useSearchContext } from '../SearchContext';
import {
  useAnnounceSearchResultCount,
  useSearchResultsKeyboardNavigation,
} from '../hooks';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  activeSources: nextValue.sources.filter((s) => s.isActive),
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchResults = () => {
  const { t } = useTranslationContext();
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchResultsPresearch = DefaultSearchResultsPresearch,
    SearchSourceResults = DefaultSourceSearchResults,
  } = useComponentContext();
  const { searchController } = useSearchContext();
  const { activeSources, isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const { onKeyDown } = useSearchResultsKeyboardNavigation(resultsRef);
  // Announces the result count and the end-of-list status once the list settles, only while search
  // is active with a query (not during presearch).
  useAnnounceSearchResultCount(resultsRef, isActive && !!searchQuery, activeSources);

  return !isActive ? null : (
    <div
      aria-label={t('search.results.searchResults.ariaLabel', 'Search results')}
      className='str-chat__search-results'
      onKeyDown={onKeyDown}
      ref={resultsRef}
    >
      <SearchResultsHeader />
      {!searchQuery ? (
        <SearchResultsPresearch activeSources={activeSources} />
      ) : (
        activeSources.map((source) => (
          <SearchSourceResults key={source.type} searchSource={source} />
        ))
      )}
    </div>
  );
};
