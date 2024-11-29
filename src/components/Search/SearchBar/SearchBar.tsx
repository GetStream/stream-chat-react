import clsx from 'clsx';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SearchControllerState } from '../SearchController';
import { useSearchContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const searchControllerStateSelector = (nextValue: SearchControllerState) => ({
  input: nextValue.input,
  searchQuery: nextValue.searchQuery,
});

// todo: add context menu control logic
// todo: do not clear input on blur
export const SearchBar = () => {
  const { t } = useTranslationContext();
  const {
    disabled,
    exitSearchOnInputBlur,
    onSearchExit,
    placeholder,
    searchController,
    searchDebounceIntervalMs = 200,
  } = useSearchContext();
  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [value, setValue] = useState('');

  const searchBarRef = useRef<HTMLDivElement>(null);
  const { input, searchQuery } = useStateStore(
    searchController.state,
    searchControllerStateSelector,
  );

  const scheduleSearch = useMemo(
    () =>
      debounce(async (text: string) => {
        await searchController.search(text);
      }, searchDebounceIntervalMs),
    [searchController, searchDebounceIntervalMs],
  );

  const exitSearch = useCallback(() => {
    if (!input || disabled) return;
    input.blur();
    searchController.resetState();
    onSearchExit?.();
  }, [searchController, disabled, input, onSearchExit]);

  useEffect(() => {
    if (!input) return;
    const handleFocus = () => {
      setInputIsFocused(true);
      searchController.activate();
    };

    const handleBlur = (e: Event) => {
      e.stopPropagation(); // handle blur/focus state with React state
      setInputIsFocused(false);
      if (exitSearchOnInputBlur) {
        searchController.resetState();
        onSearchExit?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return exitSearch();
    };

    input.addEventListener('focus', handleFocus);
    input.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [input, disabled, exitSearch, exitSearchOnInputBlur, onSearchExit, searchController]);

  return (
    <div className='str-chat__channel-search-bar' data-testid='search-bar' ref={searchBarRef}>
      {inputIsFocused ? (
        <button
          className={clsx(
            'str-chat__channel-search-bar-button str-chat__channel-search-bar-button--exit-search',
          )}
          data-testid='search-bar-button'
          onClick={exitSearch}
        >
          <div className='str-chat__channel-search-bar-button--exit-search-icon' />
        </button>
      ) : null}

      <div
        className={clsx(
          'str-chat__channel-search-input--wrapper',
          searchQuery && 'str-chat__channel-search-input--wrapper-active',
        )}
      >
        <div className='str-chat__channel-search-input--icon' />
        <input
          className='str-chat__channel-search-input'
          data-testid='search-input'
          disabled={disabled}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.target.value);
            event.preventDefault();
            if (disabled) return;
            if (event.target.value) {
              scheduleSearch(event.target.value);
            } else if (!event.target.value) {
              scheduleSearch.cancel();
            }
          }}
          placeholder={placeholder ?? t('Search')}
          ref={searchController.setInputElement}
          type='text'
          value={value}
        />
        <button
          className='str-chat__channel-search-input--clear-button'
          data-testid='clear-input-button'
          disabled={!searchQuery}
          onClick={() => {
            if (!input || disabled) return;
            searchController.resetState();
            input.focus();
          }}
        >
          <div className='str-chat__channel-search-input--clear-button-icon' />
        </button>
      </div>
    </div>
  );
};
