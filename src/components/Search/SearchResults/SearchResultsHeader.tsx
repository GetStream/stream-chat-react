import clsx from 'clsx';
import React from 'react';
import type { SearchSource, SearchSourceState } from 'stream-chat';

import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { Button } from '../../../components';
import { asDynamicKey } from '../../../i18n/utils';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isActive: nextValue.isActive,
});

/** The tab label of a search source: bundled copy for the built-in sources, else the source's type. */
const useSourceLabel = (type: SearchSource['type']) => {
  const { t } = useTranslationContext();
  switch (type) {
    case 'channels':
      return t('search.resultsHeader.filterSource.channels', 'channels');
    case 'messages':
      return t('search.resultsHeader.filterSource.messages', 'messages');
    case 'users':
      return t('search.resultsHeader.filterSource.users', 'users');
    default:
      // An app names a custom source by translating its label key.
      return t(
        asDynamicKey(`search-results-header-filter-source-button-label--${type}`),
        type,
      );
  }
};

type SearchSourceFilterButtonProps = {
  source: SearchSource;
};

const SearchSourceFilterButton = ({ source }: SearchSourceFilterButtonProps) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext();
  const { isActive } = useStateStore(source.state, searchSourceStateSelector);
  const buttonContent = useSourceLabel(source.type);
  return (
    <Button
      appearance='outline'
      aria-label={t(
        'search.resultsHeader.ariaLabel',
        'Search results header filter button for: {{ source }}',
        {
          source: buttonContent,
        },
      )}
      aria-pressed={isActive}
      className={clsx('str-chat__search-results-header__filter-source-button', {
        'str-chat__search-results-header__filter-source-button--active': isActive,
      })}
      onClick={() => {
        if (source.isActive) {
          searchController.deactivateSource(source.type);
        } else {
          searchController.activateSource(source.type);
          if (searchController.searchQuery && !source.items?.length)
            source.search(searchController.searchQuery);
        }
      }}
      size='xs'
      variant='secondary'
    >
      {buttonContent}
    </Button>
  );
};

export const SearchResultsHeader = () => {
  const { filterButtonsContainerRef, searchController } = useSearchContext();

  // A single source has nothing to filter.
  if (searchController.sources.length < 2) return null;

  return (
    <div className='str-chat__search-results-header' data-testid='search-results-header'>
      <div
        className='str-chat__search-results-header__filter-source-buttons'
        data-testid='filter-source-buttons'
        ref={filterButtonsContainerRef}
      >
        {searchController.sources.map((source) => (
          <SearchSourceFilterButton key={source.type} source={source} />
        ))}
      </div>
    </div>
  );
};
