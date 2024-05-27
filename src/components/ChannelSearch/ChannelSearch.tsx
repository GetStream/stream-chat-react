import clsx from 'clsx';
import React from 'react';

import { ChannelSearchControllerParams, useChannelSearch } from './hooks/useChannelSearch';

import type { AdditionalSearchBarProps, SearchBarProps } from './SearchBar';
import { SearchBar as DefaultSearchBar } from './SearchBar';
import {
  AdditionalSearchInputProps,
  SearchInput as DefaultSearchInput,
  SearchInputProps,
} from './SearchInput';
import { AdditionalSearchResultsProps, SearchResults } from './SearchResults';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type AdditionalChannelSearchProps = {
  /** Custom UI component to display the search bar with text input */
  SearchBar?: React.ComponentType<SearchBarProps>;
  /** Custom UI component to display the search text input */
  SearchInput?: React.ComponentType<SearchInputProps>;
};

export type ChannelSearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = AdditionalSearchBarProps &
  AdditionalSearchInputProps &
  AdditionalSearchResultsProps<StreamChatGenerics> &
  AdditionalChannelSearchProps &
  ChannelSearchControllerParams<StreamChatGenerics>;

const UnMemoizedChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelSearchProps<StreamChatGenerics>,
) => {
  const {
    AppMenu,
    ClearInputIcon,
    ExitSearchIcon,
    MenuIcon,
    placeholder,
    popupResults = false,
    SearchBar = DefaultSearchBar,
    SearchEmpty,
    SearchInput = DefaultSearchInput,
    SearchLoading,
    SearchInputIcon,
    SearchResultItem,
    SearchResultsList,
    SearchResultsHeader,
    ...channelSearchParams
  } = props;

  const {
    activateSearch,
    clearState,
    exitSearch,
    inputIsFocused,
    inputRef,
    onSearch,
    query,
    results,
    searchBarRef,
    searching,
    selectResult,
  } = useChannelSearch<StreamChatGenerics>(channelSearchParams);

  return (
    <div
      className={clsx(
        'str-chat__channel-search',
        popupResults ? 'str-chat__channel-search--popup' : 'str-chat__channel-search--inline',
        {
          'str-chat__channel-search--with-results': results.length > 0,
        },
      )}
      data-testid='channel-search'
    >
      <SearchBar
        activateSearch={activateSearch}
        AppMenu={AppMenu}
        ClearInputIcon={ClearInputIcon}
        clearState={clearState}
        disabled={channelSearchParams.disabled}
        exitSearch={exitSearch}
        ExitSearchIcon={ExitSearchIcon}
        inputIsFocused={inputIsFocused}
        inputRef={inputRef}
        MenuIcon={MenuIcon}
        onSearch={onSearch}
        placeholder={placeholder}
        query={query}
        searchBarRef={searchBarRef}
        SearchInput={SearchInput}
        SearchInputIcon={SearchInputIcon}
      />

      {query && (
        <SearchResults
          popupResults={popupResults}
          results={results}
          SearchEmpty={SearchEmpty}
          searching={searching}
          SearchLoading={SearchLoading}
          SearchResultItem={SearchResultItem}
          SearchResultsHeader={SearchResultsHeader}
          SearchResultsList={SearchResultsList}
          selectResult={selectResult}
        />
      )}
    </div>
  );
};

/**
 * The ChannelSearch component makes a query users call and displays the results in a list.
 * Clicking on a list item will navigate you into a channel with the selected user. It can be used
 * on its own or added to the ChannelList component by setting the `showChannelSearch` prop to true.
 */
export const ChannelSearch = React.memo(UnMemoizedChannelSearch) as typeof UnMemoizedChannelSearch;
