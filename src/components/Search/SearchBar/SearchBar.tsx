import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import { useSearchContext } from '../SearchContext';
import { useSearchQueriesInProgress } from '../hooks';
import { useInteractionAnnouncements } from '../../Accessibility';
import { useComponentContextIcons, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { Button } from '../../../components';

import type { SearchControllerState } from 'stream-chat';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  isActive: nextValue.isActive,
  searchQuery: nextValue.searchQuery,
});

export const SearchBar = () => {
  const { t } = useTranslationContext();
  const { IconSearch, IconXCircle } = useComponentContextIcons();
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

  const [input, setInput] = useState<HTMLInputElement | null>(null);
  // Whether the latest pointerdown landed inside the widget. A blur with a null `relatedTarget`
  // means either focus left the widget or a non-focusable descendant (icon, padding) was pressed;
  // only the first should collapse search.
  const pointerDownInsideRef = useRef(false);
  const { isActive, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      pointerDownInsideRef.current = !!containerRef.current?.contains(
        event.target as Node | null,
      );
    };
    // Capture phase, so it runs before the input's blur.
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [containerRef]);

  useEffect(() => {
    if (!input) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        searchController.exit();
        // Keep focus on the input rather than letting it drop to the body.
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
        <IconSearch />
        <input
          {...inputProps}
          aria-label={t('common.search.ariaLabel', 'Search')}
          className={clsx('str-chat__search-bar__input', inputProps?.className)}
          data-testid='search-input'
          disabled={disabled}
          onBlur={({ relatedTarget }) => {
            // Exit only when focus leaves the widget. Moving to a control inside it (results,
            // filter buttons, clear, Cancel) must not collapse search; Cancel exits through its own
            // activation (WCAG 3.2.1).
            if (!exitSearchOnInputBlur) return;
            const focusMovedInside = !!containerRef.current?.contains(relatedTarget);
            // A null relatedTarget also occurs when a non-focusable element inside the widget is
            // pressed; the preceding pointerdown tells the two cases apart.
            const pressedInside = relatedTarget === null && pointerDownInsideRef.current;
            pointerDownInsideRef.current = false;
            if (!focusMovedInside && !pressedInside) {
              searchController.exit();
            }
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            // Activate on input, not on focus (WCAG 3.2.1: focusing a control must not change
            // context). `search()` runs against the active sources, so activate first; `activate()`
            // is idempotent.
            if (event.target.value) {
              searchController.activate();
              searchController.search(event.target.value);
            } else {
              searchController.clear();
            }
          }}
          placeholder={placeholder ?? t('common.search.ariaLabel', 'Search')}
          ref={setInput}
          type='text'
          value={searchQuery}
        />
        {searchQuery && (
          <Button
            appearance='ghost'
            aria-label={t('search.bar.clearSearch.ariaLabel', 'Clear search')}
            circular
            className='str-chat__search-bar__clear-button'
            data-testid='clear-input-button'
            disabled={queriesInProgress.length > 0} // no clearing while a query is in progress
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
          aria-label={t('search.bar.exitSearch.ariaLabel', 'Exit search')}
          className='str-chat__search-bar__exit-search-button'
          data-testid='search-bar-button'
          onClick={() => {
            searchController.exit();
            // Return focus to the input so navigation continues from there.
            input?.focus();
          }}
          size='sm'
          variant='secondary'
        >
          {t('common.cancel.label', 'Cancel')}
        </Button>
      )}
    </div>
  );
};
