import clsx from 'clsx';
import React from 'react';
import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { SearchResultsPresearch as DefaultSearchResultsPresearch } from './SearchResultsPresearch';
import type {
  DefaultSearchSources,
  SearchControllerState,
  SearchSource,
} from '../SearchController';
import { useSearchContext } from '../SearchContext';
import { useComponentContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  nextValue: SearchControllerState<StreamChatGenerics, SearchSources>,
) => ({
  activeSources: nextValue.sources.filter((s) => s.isActive),
  isSearchActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>() => {
  const { t } = useTranslationContext('ResultsContainer');
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchSourceResults = DefaultSourceSearchResults,
    SearchResultsPresearch = DefaultSearchResultsPresearch,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { searchController } = useSearchContext<StreamChatGenerics, SearchSources>();
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
