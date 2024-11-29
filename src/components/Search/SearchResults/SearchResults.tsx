import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

import { SearchSourceResults as DefaultSourceSearchResults } from './SearchSourceResults';
import { SearchResultsHeader as DefaultSearchResultsHeader } from './SearchResultsHeader';
import { useComponentContext, useSearchContext, useTranslationContext } from '../../../context';
import type { DefaultSearchSources, SearchSource } from '../SearchController';
import type { DefaultStreamChatGenerics } from '../../../types';

export const SearchResults = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources
>() => {
  const { t } = useTranslationContext('ResultsContainer');
  const {
    SearchResultsHeader = DefaultSearchResultsHeader,
    SearchSourceResults = DefaultSourceSearchResults,
  } = useComponentContext<StreamChatGenerics, NonNullable<unknown>, Sources>(); // todo: solve CustomTrigger generic
  const { searchController } = useSearchContext<Sources>();
  const [displayedSearchSource, setDisplayedSearchSource] = useState<Sources[number]['type']>(
    searchController.searchSourceTypes[0],
  );

  const selectSearchSource = useCallback((searchSource: Sources[number]['type']) => {
    setDisplayedSearchSource(searchSource);
  }, []);

  return (
    <div aria-label={t('aria/Search results')} className={clsx(`str-chat__search-results`)}>
      <SearchResultsHeader
        displayedSearchSource={displayedSearchSource}
        selectSearchSource={selectSearchSource}
      />
      <SearchSourceResults searchSource={displayedSearchSource} />
    </div>
  );
};
