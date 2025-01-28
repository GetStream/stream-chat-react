import clsx from 'clsx';
import React from 'react';

import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchSource, SearchSourceState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchSourceStateSelector = (nextValue: SearchSourceState) => ({
  isActive: nextValue.isActive,
});

type SearchSourceFilterButtonProps = {
  source: SearchSource;
};

const SearchSourceFilterButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  source,
}: SearchSourceFilterButtonProps) => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<StreamChatGenerics>();
  const { isActive } = useStateStore(source.state, searchSourceStateSelector);
  const label = `search-results-header-filter-source-button-label--${source.type}`;
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
      {t<string>(label)}
    </button>
  );
};

export const SearchResultsHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { searchController } = useSearchContext<StreamChatGenerics>();
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
