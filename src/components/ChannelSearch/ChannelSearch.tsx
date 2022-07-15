import React from 'react';

import { SearchBar as DefaultSearchBar, SearchBarProps } from './SearchBar';
import { DropdownContainerProps, SearchResultItemProps, SearchResults } from './SearchResults';
import { useChannelSearch } from './hooks/useChannelSearch';

import type { ChannelOrUserResponse } from './utils';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { ChannelSearchFunctionParams, SearchQueryParams } from './hooks/useChannelSearch';

export type ChannelSearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  channelType?: string;
  /** Custom UI component to display all of the search results, defaults to accepts same props as: [DefaultDropdownContainer](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx)  */
  DropdownContainer?: React.ComponentType<DropdownContainerProps<StreamChatGenerics>>;
  /** Custom handler function to run on search result item selection */
  onSelectResult?: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
  /** Custom placeholder text to be displayed in the search input */
  placeholder?: string;
  /** Display search results as an absolutely positioned popup, defaults to false and shows inline */
  popupResults?: boolean;
  /** Custom UI component to display the search text input */
  SearchBar?: React.ComponentType<SearchBarProps<StreamChatGenerics>>;
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Boolean to search for channels as well as users in the server query, default is false and just searches for users */
  searchForChannels?: boolean;
  /** Custom search function to override default */
  searchFunction?: (
    params: ChannelSearchFunctionParams<StreamChatGenerics>,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
  /** Custom UI component to display the search loading state */
  SearchLoading?: React.ComponentType;
  /** Object containing filters/sort/options overrides for user search */
  searchQueryParams?: SearchQueryParams<StreamChatGenerics>;
  /** Custom UI component to display a search result list item, defaults to and accepts same props as: [DefaultSearchResultItem](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx) */
  SearchResultItem?: React.ComponentType<SearchResultItemProps<StreamChatGenerics>>;
  /** Custom UI component to display the search results header */
  SearchResultsHeader?: React.ComponentType;
};

const UnMemoizedChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelSearchProps<StreamChatGenerics>,
) => {
  const {
    channelType = 'messaging',
    DropdownContainer,
    onSelectResult,
    placeholder,
    popupResults = false,
    SearchEmpty,
    searchForChannels = false,
    searchFunction,
    SearchBar = DefaultSearchBar,
    SearchLoading,
    searchQueryParams,
    SearchResultItem,
    SearchResultsHeader,
  } = props;

  const {
    channelSearchParams,
    clearState,
    inputRef,
    onSearch,
    query,
    results,
    searching,
    selectResult,
  } = useChannelSearch<StreamChatGenerics>({ channelType, searchForChannels, searchQueryParams });

  return (
    <div className='str-chat__channel-search' data-testid='channel-search'>
      <SearchBar
        channelSearchParams={channelSearchParams}
        clearState={clearState}
        inputRef={inputRef}
        onSearch={onSearch}
        placeholder={placeholder}
        query={query}
        searchFunction={searchFunction}
      />
      {query && (
        <SearchResults
          DropdownContainer={DropdownContainer}
          popupResults={popupResults}
          results={results}
          SearchEmpty={SearchEmpty}
          searching={searching}
          SearchLoading={SearchLoading}
          SearchResultItem={SearchResultItem}
          SearchResultsHeader={SearchResultsHeader}
          selectResult={onSelectResult || selectResult}
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
