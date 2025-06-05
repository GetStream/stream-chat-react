import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { useSearchContext } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

import type { SearchControllerState } from 'stream-chat';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchBar = () => {
  const { t } = useTranslationContext();
  const { disabled, exitSearchOnInputBlur, placeholder, searchController } =
    useSearchContext();
  const queriesInProgress = useSearchQueriesInProgress(searchController);

  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const { isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  useEffect(() => {
    if (!input) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        input.blur();
        searchController.exit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchController, input]);

  return (
    <div className='str-chat__search-bar' data-testid='search-bar'>
      <div
        className={clsx('str-chat__search-input--wrapper', {
          'str-chat__search-input--wrapper-active': isActive,
        })}
      >
        <div className='str-chat__search-input--icon' />
        <input
          className='str-chat__search-input'
          data-testid='search-input'
          disabled={disabled}
          onBlur={() => {
            if (exitSearchOnInputBlur) searchController.exit();
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            if (event.target.value) {
              searchController.search(event.target.value);
            } else if (!event.target.value) {
              searchController.clear();
            }
          }}
          onFocus={searchController.activate}
          placeholder={placeholder ?? t('Search')}
          ref={setInput}
          type='text'
          value={searchQuery}
        />
        {searchQuery && (
          <button
            className='str-chat__search-input--clear-button'
            data-testid='clear-input-button'
            disabled={queriesInProgress.length > 0} // prevent user from clearing the input while query is in progress and avoid out-of-sync UX
            onClick={() => {
              searchController.clear();
              input?.focus();
            }}
          >
            <div className='str-chat__search-input--clear-button-icon' />
          </button>
        )}
      </div>
      {isActive ? (
        <button
          className={clsx(
            'str-chat__search-bar-button str-chat__search-bar-button--exit-search',
          )}
          data-testid='search-bar-button'
          onClick={() => {
            input?.blur();
            searchController.exit();
          }}
        >
          {t('Cancel')}
        </button>
      ) : null}
    </div>
  );
};
