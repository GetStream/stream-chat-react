import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { useStableId } from '../../UtilityComponents/useStableId';
import { useSearchContext } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import { useInteractionAnnouncements } from '../../Accessibility';
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
  const { announceInteraction } = useInteractionAnnouncements();
  const {
    disabled,
    exitSearchOnInputBlur,
    filterButtonsContainerRef,
    placeholder,
    searchController,
  } = useSearchContext();
  const queriesInProgress = useSearchQueriesInProgress(searchController);
  const clearButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const searchInputId = useStableId();

  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const { isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  useEffect(() => {
    if (!input) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        searchController.exit();
        // Keep focus on the search input (it no longer re-activates search on focus), so the user
        // can keep navigating from a known place rather than having focus drop to the body.
        input.focus();
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
            // Activate search on user input — NOT on focus (WCAG 3.2.1: focusing a control must not
            // change context). `search()` runs against the active sources, so activation has to
            // happen here; `activate()` is idempotent once already active.
            if (event.target.value) {
              searchController.activate();
              searchController.search(event.target.value);
            } else {
              searchController.clear();
            }
          }}
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
              announceInteraction('search.cleared');
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
            searchController.exit();
            // Return focus to the search input so navigation can continue from there (focusing it
            // no longer re-activates search — see RW19).
            input?.focus();
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
