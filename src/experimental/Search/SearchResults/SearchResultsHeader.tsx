import clsx from 'clsx';
import React from 'react';

import { useSearchContext } from '../SearchContext';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchControllerState } from 'stream-chat';
import type { DefaultStreamChatGenerics } from '../../../types';

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: SearchControllerState<StreamChatGenerics>,
) => ({
  activeSourceTypes: nextValue.sources.reduce<string[]>((acc, s) => {
    if (s.isActive) {
      acc.push(s.type);
    }
    return acc;
  }, []),
});

export const SearchResultsHeader = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>() => {
  const { t } = useTranslationContext();
  const { searchController } = useSearchContext<StreamChatGenerics>();
  const { activeSourceTypes } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );
  return (
    <div className='str-chat__search-results-header'>
      <div className='str-chat__search-results-header__filter-source-buttons'>
        {searchController.searchSourceTypes.map((searchSourceType) => {
          const label = `search-results-header-filter-source-button-label--${searchSourceType}`;
          const isActive = activeSourceTypes.includes(searchSourceType);
          return (
            <button
              aria-label={t('aria/Search results header filter button')}
              className={clsx('str-chat__search-results-header__filter-source-button', {
                'str-chat__search-results-header__filter-source-button--active': isActive,
              })}
              key={label}
              onClick={() => {
                if (activeSourceTypes.includes(searchSourceType)) {
                  searchController.deactivateSource(searchSourceType);
                } else {
                  searchController.activateSource(searchSourceType);
                }
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
