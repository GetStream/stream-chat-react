import clsx from 'clsx';
import React from 'react';
import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { SearchResultsPresearch as DefaultSearchResultsPresearch } from './SearchResultsPresearch';
import type { SearchControllerState } from '../SearchController';
import { useSearchContext } from '../SearchContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: SearchControllerState<StreamChatGenerics>,
) => ({
  activeSources: nextValue.sources.filter((s) => s.isActive),
  isSearchActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { t } = useTranslationContext('ResultsContainer');
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchSourceResults = DefaultSourceSearchResults,
    SearchResultsPresearch = DefaultSearchResultsPresearch,
  } = useComponentContext<StreamChatGenerics>();
  const { searchController } = useSearchContext<StreamChatGenerics>();
  const { activeSources, isSearchActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  return !isSearchActive ? null : (
    <div aria-label={t('aria/Search results')} className={clsx(`str-chat__search-results`)}>
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
