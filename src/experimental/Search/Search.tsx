import clsx from 'clsx';
import React from 'react';

import { SearchControllerState } from './SearchController';
import { SearchBar as DefaultSearchBar } from './SearchBar/SearchBar';
import { SearchResults as DefaultSearchResults } from './SearchResults/SearchResults';
import { SearchContextProvider } from './SearchContext';
import { useChatContext, useComponentContext } from '../../context';
import { useStateStore } from '../../store';

import type { DefaultStreamChatGenerics } from '../../types';

type SearchControllerStateSelectorReturnValue = {
  isActive: boolean;
};

const searchControllerStateSelector = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  nextValue: SearchControllerState<StreamChatGenerics>,
): SearchControllerStateSelectorReturnValue => ({ isActive: nextValue.isActive });

// todo: rename all search components to Search only
export type SearchProps = {
  /** Sets the input element into disabled state */
  disabled?: boolean;
  /** Clear search state / results on every click outside the search input, defaults to true */
  exitSearchOnInputBlur?: boolean;
  /** Callback invoked with every search input change handler */
  inputOnChangeHandler?: React.ChangeEventHandler<HTMLInputElement>;
  /** Callback invoked when the search UI is deactivated */
  onSearchExit?: () => void;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
  userToUserCreatedChannelType?: string;
};

export const Search = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  disabled,
  exitSearchOnInputBlur,
  inputOnChangeHandler,
  onSearchExit,
  placeholder,
  userToUserCreatedChannelType = 'messaging',
}: SearchProps) => {
  const {
    SearchBar = DefaultSearchBar,
    SearchResults = DefaultSearchResults,
  } = useComponentContext();

  const { searchController } = useChatContext<StreamChatGenerics>();

  const { isActive } = useStateStore<
    SearchControllerState<StreamChatGenerics>,
    SearchControllerStateSelectorReturnValue
  >(searchController.state, searchControllerStateSelector);

  return (
    <SearchContextProvider<StreamChatGenerics>
      value={{
        disabled,
        exitSearchOnInputBlur,
        inputOnChangeHandler,
        onSearchExit,
        placeholder,
        searchController,
        userToUserCreatedChannelType,
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
