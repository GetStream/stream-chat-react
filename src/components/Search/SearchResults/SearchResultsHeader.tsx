import clsx from 'clsx';
import React from 'react';
import { DefaultSearchSources, SearchControllerState, SearchSource } from '../SearchController';
import { useSearchContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  nextValue: SearchControllerState<StreamChatGenerics, Sources>,
) => ({
  activeSource: nextValue.activeSource,
});

export const SearchResultsHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>() => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<StreamChatGenerics, Sources>();
  const { activeSource } = useStateStore(searchController.state, searchControllerStateSelector);
  return (
    <div className='str-chat__search-results-header'>
      <div className='str-chat__search-results-header__filter-source-buttons'>
        {searchController.searchSourceTypes.map((searchSourceType) => {
          const label = `search-results-header-filter-source-button-label--${searchSourceType}`;
          const isActive = searchSourceType === activeSource?.type;
          return (
            <button
              aria-label={t('aria/Search results header filter button')}
              className={clsx('str-chat__search-results-header__filter-source-button', {
                'str-chat__search-results-header__filter-source-button--active': isActive,
              })}
              disabled={isActive}
              key={label}
              onClick={() => {
                searchController.setActiveSource(searchSourceType, {
                  searchQuery: searchController.searchQuery,
                });
              }}
            >
              {t<string>(label)}
            </button>
          );
        })}
      </div>
    </div>
  );
};
