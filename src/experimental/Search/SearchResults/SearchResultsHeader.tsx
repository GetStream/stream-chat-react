import clsx from 'clsx';
import React, { useMemo } from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isActive: nextValue.isActive,
});

type SearchSourceFilterButtonProps = {
  source: SearchSource;
};

const SearchSourceFilterButton = ({ source }: SearchSourceFilterButtonProps) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext();
  const { isActive } = useStateStore(source.state, searchSourceStateSelector);
  const label = `search-results-header-filter-source-button-label--${source.type}`;

  const knownLabels = useMemo<Record<string, string>>(
    () => ({
      'search-results-header-filter-source-button-label--channels': t(
        'search-results-header-filter-source-button-label--channels',
      ),
      'search-results-header-filter-source-button-label--messages': t(
        'search-results-header-filter-source-button-label--messages',
      ),
      'search-results-header-filter-source-button-label--users': t(
        'search-results-header-filter-source-button-label--users',
      ),
    }),
    [t],
  );

  return (
    <button
      aria-label={t('aria/Search results header filter button')}
      className={clsx('str-chat__search-results-header__filter-source-button', {
        'str-chat__search-results-header__filter-source-button--active': isActive,
      })}
      key={label}
      onClick={() => {
        if (source.isActive) {
          searchController.deactivateSource(source.type);
        } else {
          searchController.activateSource(source.type);
          if (searchController.searchQuery && !source.items?.length)
            source.search(searchController.searchQuery);
        }
      }}
    >
      {knownLabels[label] ?? t(label)}
    </button>
  );
};

export const SearchResultsHeader = () => {
  const { searchController } = useSearchContext();
  return (
    <div className='str-chat__search-results-header' data-testid='search-results-header'>
      <div
        className='str-chat__search-results-header__filter-source-buttons'
        data-testid='filter-source-buttons'
      >
        {searchController.sources.map((source) => (
          <SearchSourceFilterButton
            key={`search-source-filter-button-${source.type}`}
            source={source}
          />
        ))}
      </div>
    </div>
  );
};
