import clsx from 'clsx';
import React, { useEffect } from 'react';
import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { useComponentContext, useSearchContext, useTranslationContext } from '../../../context';
import type {
  DefaultSearchSources,
  SearchControllerState,
  SearchSource,
} from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  nextValue: SearchControllerState<StreamChatGenerics, SearchSources>,
) => ({
  activeSource: nextValue.activeSource,
  isSearchActive: nextValue.isActive,
});

export type SearchResultsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
> = {
  activeSourceType?: SearchSources[number]['type'];
};

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  SearchSources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>({
  activeSourceType,
}: SearchResultsProps) => {
  const { t } = useTranslationContext('ResultsContainer');
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchSourceResults = DefaultSourceSearchResults,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, SearchSources>();
  const { searchController } = useSearchContext<StreamChatGenerics, SearchSources>();
  const { activeSource, isSearchActive } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  useEffect(() => {
    if (searchController.activeSource) return;
    const defaultActiveSourceType = Object.keys(searchController.sources)[0];
    searchController.setActiveSource(activeSourceType ?? defaultActiveSourceType);
  }, [activeSourceType, searchController]);

  useEffect(() => {
    if (!activeSource || (!isSearchActive && !activeSource.items)) return;
    activeSource.search();
  }, [activeSource, isSearchActive]);

  if (!isSearchActive) return null;

  return (
    <div aria-label={t('aria/Search results')} className={clsx(`str-chat__search-results`)}>
      <SearchResultsHeader />
      {activeSource && <SearchSourceResults key={activeSource.type} searchSource={activeSource} />}
    </div>
  );
};
