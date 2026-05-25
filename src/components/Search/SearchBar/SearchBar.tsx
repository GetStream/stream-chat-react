import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { useStableId } from '../../../utils/useStableId';
import { useSearchContext } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import { useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { Button, IconSearch, IconXCircle, VisuallyHidden } from '../../../components';

import type { SearchControllerState } from 'stream-chat';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchBar = () => {
  const { t } = useTranslationContext();
  const {
    disabled,
    exitSearchOnInputBlur,
    filterButtonsContainerRef,
    placeholder,
    searchController,
  } = useSearchContext();
  const queriesInProgress = useSearchQueriesInProgress(searchController);
  const clearButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const searchInputId = useStableId('search-input');

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
    <div className='str-chat__search-bar' data-testid='search-bar' role='search'>
      <div
        className={clsx('str-chat__search-bar__input-wrapper', {
          'str-chat__search-bar__input-wrapper--active': isActive,
        })}
      >
        <label htmlFor={searchInputId}>
          <VisuallyHidden>{t('Search')}</VisuallyHidden>
        </label>
        <IconSearch />
        <input
          className='str-chat__search-bar__input'
          data-testid='search-input'
          disabled={disabled}
          id={searchInputId}
          onBlur={({ currentTarget, relatedTarget }) => {
            if (
              exitSearchOnInputBlur &&
              // input is empty
              !currentTarget.value &&
              // clicking on filter buttons or clear button shouldn't trigger exit search on blur
              !filterButtonsContainerRef.current?.contains(relatedTarget) &&
              // clicking clear button shouldn't trigger exit search on blur
              (!clearButtonRef.current || relatedTarget !== clearButtonRef.current)
            ) {
              searchController.exit();
            }
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
          <Button
            appearance='ghost'
            aria-label={t('aria/Clear search')}
            circular
            className='str-chat__search-bar__clear-button'
            data-testid='clear-input-button'
            disabled={queriesInProgress.length > 0} // prevent user from clearing the input while query is in progress and avoid out-of-sync UX
            onClick={() => {
              searchController.clear();
              input?.focus();
            }}
            ref={clearButtonRef}
            size='xs'
            variant='secondary'
          >
            <IconXCircle />
          </Button>
        )}
      </div>
      {isActive && (
        <Button
          appearance='ghost'
          aria-label={t('aria/Exit search')}
          className='str-chat__search-bar__exit-search-button'
          data-testid='search-bar-button'
          onClick={() => {
            input?.blur();
            searchController.exit();
          }}
          size='sm'
          variant='secondary'
        >
          {t('Cancel')}
        </Button>
      )}
    </div>
  );
};
