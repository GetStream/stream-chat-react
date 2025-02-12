import clsx from 'clsx';
import React from 'react';
import type { SearchControllerState } from 'stream-chat';

import { SearchBar as DefaultSearchBar } from './SearchBar/SearchBar';
import { SearchResults as DefaultSearchResults } from './SearchResults/SearchResults';
import { SearchContextProvider } from './SearchContext';
import { useChatContext, useComponentContext } from '../../context';
import { useStateStore } from '../../store';

type SearchControllerStateSelectorReturnValue = {
  isActive: boolean;
};

const searchControllerStateSelector = (
  nextValue: SearchControllerState,
): SearchControllerStateSelectorReturnValue => ({ isActive: nextValue.isActive });

export type SearchProps = {
  directMessagingChannelType?: string;
  /** Sets the input element into disabled state */
  disabled?: boolean;
  /** Clear search state / results on every click outside the search input, defaults to false */
  exitSearchOnInputBlur?: boolean;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
};

export const Search = ({
  directMessagingChannelType = 'messaging',
  disabled,
  exitSearchOnInputBlur,
  placeholder,
}: SearchProps) => {
  const { SearchBar = DefaultSearchBar, SearchResults = DefaultSearchResults } =
    useComponentContext();

  const { searchController } = useChatContext();

  const { isActive } = useStateStore<
    SearchControllerState,
    SearchControllerStateSelectorReturnValue
  >(searchController.state, searchControllerStateSelector);

  return (
    <SearchContextProvider
      value={{
        directMessagingChannelType,
        disabled,
        exitSearchOnInputBlur,
        placeholder,
        searchController,
      }}
    >
      <div
        className={clsx('str-chat__search', {
          'str-chat__search--active': isActive,
        })}
        data-testid='search'
      >
        <SearchBar />
        <SearchResults />
      </div>
    </SearchContextProvider>
  );
};
