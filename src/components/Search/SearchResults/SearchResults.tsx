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
  const { t } = useTranslationContext('ResultsContainer');
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
  // Announce the number of listed results once the list settles (only while a query is in progress,
  // not during presearch).
  useAnnounceSearchResultCount(resultsRef, isActive && !!searchQuery);

  return !isActive ? null : (
    <div
      aria-label={t('aria/Search results')}
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
