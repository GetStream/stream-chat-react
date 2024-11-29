import clsx from 'clsx';
import React from 'react';

import { DefaultSearchSources, SearchControllerState, SearchSource } from './SearchController';
import { SearchBar } from './SearchBar/SearchBar';
import { SearchResults } from './SearchResults/SearchResults';
import { SearchContextProvider, useChatContext } from '../../context';
import { useStateStore } from '../../store';

import type { DefaultStreamChatGenerics } from '../../types/types';

type SearchControllerStateSelectorReturnValue = {
  isActive: boolean;
};

const searchControllerStateSelector = <Sources extends SearchSource[]>(
  nextValue: SearchControllerState<Sources>,
): SearchControllerStateSelectorReturnValue => ({ isActive: nextValue.isActive });

// todo: rename all search components to Search only
export type SearchProps = {
  /** Sets the input element into disabled state */
  disabled?: boolean;
  /** Clear search state / results on every click outside the search input, defaults to true */
  exitSearchOnInputBlur?: boolean;
  /** Callback invoked with every search input change handler */
  onSearch?: React.ChangeEventHandler<HTMLInputElement>;
  /** Callback invoked when the search UI is deactivated */
  onSearchExit?: () => void;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
  /** The number of milliseconds to debounce the search query. The default interval is 200ms. */
  searchDebounceIntervalMs?: number;
  SearchResults?: React.ComponentType;
  userToUserCreatedChannelType?: string;
};

export const Search = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  Sources extends SearchSource[] = DefaultSearchSources<StreamChatGenerics>
>(
  props: SearchProps,
) => {
  const {
    disabled,
    exitSearchOnInputBlur,
    onSearch,
    onSearchExit,
    placeholder,
    searchDebounceIntervalMs,
    userToUserCreatedChannelType = 'messaging',
  } = props;

  const { searchController } = useChatContext<StreamChatGenerics, Sources>();

  const { isActive } = useStateStore<
    SearchControllerState<Sources>,
    SearchControllerStateSelectorReturnValue
  >(searchController.state, searchControllerStateSelector);

  return (
    <SearchContextProvider<Sources>
      value={{
        disabled,
        exitSearchOnInputBlur,
        onSearch,
        onSearchExit,
        placeholder,
        searchController,
        searchDebounceIntervalMs,
        userToUserCreatedChannelType,
      }}
    >
      <div
        className={clsx('str-chat__channel-search', {
          'str-chat__channel-search--active': isActive,
        })}
        data-testid='channel-search'
      >
        <SearchBar />
        <SearchResults />
      </div>
    </SearchContextProvider>
  );
};
