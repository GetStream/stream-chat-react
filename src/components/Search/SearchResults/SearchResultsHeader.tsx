import { useSearchContext, useTranslationContext } from '../../../context';
import type { DefaultSearchSources, SearchSource } from '../SearchController';
import React from 'react';

export type SearchResultsHeaderProps<Sources extends SearchSource[] = DefaultSearchSources> = {
  displayedSearchSource: Sources[number]['type'];
  selectSearchSource(searchSource: Sources[number]['type']): void;
};

export const SearchResultsHeader = <Sources extends SearchSource[] = DefaultSearchSources>({
  displayedSearchSource,
  selectSearchSource,
}: SearchResultsHeaderProps<Sources>) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<Sources>();
  return (
    <div className='str-chat__search-results-header'>
      {searchController.searchSourceTypes.map((searchSource) => {
        const label = `search-results-header-filter-button-label--${searchSource}`;
        return (
          <button
            aria-label={t('aria/Search results header filter button')}
            className='str-chat__search-results-header__filter-button'
            disabled={searchSource === displayedSearchSource}
            key={label}
            onClick={() => selectSearchSource(searchSource)}
          >
            {t<string>(label)}
          </button>
        );
      })}
    </div>
  );
};
