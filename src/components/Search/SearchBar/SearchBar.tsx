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
    containerRef,
    disabled,
    exitSearchOnInputBlur,
    inputProps,
    placeholder,
    searchController,
  } = useSearchContext();
  const queriesInProgress = useSearchQueriesInProgress(searchController);
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
          {...inputProps}
          className={clsx('str-chat__search-bar__input', inputProps?.className)}
          data-testid='search-input'
          disabled={disabled}
          id={searchInputId}
          onBlur={({ relatedTarget }) => {
            // Exit search only when focus leaves the search widget entirely. Moving focus to a
            // control inside it — the results list, the source filter buttons, the clear button,
            // or the Cancel/exit button — is not "leaving search", so it must not collapse it (the
            // Cancel button exits via its own activation, per WCAG 3.2.1). This matches the
            // documented contract ("clear on every click outside the search") independent of
            // whether the input currently holds a query — an empty input is not activated, so the
            // previous value check only ever suppressed the exit while a query was present.
            if (exitSearchOnInputBlur && !containerRef.current?.contains(relatedTarget)) {
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
