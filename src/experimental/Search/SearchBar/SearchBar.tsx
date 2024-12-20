import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { useSearchContext } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import type { SearchControllerState } from '../SearchController';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  input: nextValue.input,
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchBar = () => {
  const { t } = useTranslationContext();
  const {
    disabled,
    exitSearchOnInputBlur,
    onSearchExit,
    placeholder,
    searchController,
  } = useSearchContext();
  const queriesInProgress = useSearchQueriesInProgress(searchController);

  const { input, isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  const exitSearch = useCallback(() => {
    searchController.exit();
    onSearchExit?.();
  }, [searchController, onSearchExit]);

  useEffect(() => {
    if (!input) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        input.blur();
        exitSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exitSearch, input]);

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
            if (exitSearchOnInputBlur) exitSearch();
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
          ref={searchController.setInputElement}
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
          className={clsx('str-chat__search-bar-button str-chat__search-bar-button--exit-search')}
          data-testid='search-bar-button'
          onClick={() => {
            input?.blur();
            exitSearch();
          }}
        >
          {t<string>('Cancel')}
        </button>
      ) : null}
    </div>
  );
};