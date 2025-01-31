import React from 'react';

import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { SearchResultsPresearch as DefaultSearchResultsPresearch } from './SearchResultsPresearch';
import { useSearchContext } from '../SearchContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchControllerState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  activeSources: nextValue.sources.filter((s) => s.isActive),
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const { t } = useTranslationContext('ResultsContainer');
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchResultsPresearch = DefaultSearchResultsPresearch,
    SearchSourceResults = DefaultSourceSearchResults,
  } = useComponentContext<StreamChatGenerics>();
  const { searchController } = useSearchContext<StreamChatGenerics>();
  const { activeSources, isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  return !isActive ? null : (
    <div aria-label={t('aria/Search results')} className='str-chat__search-results'>
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
