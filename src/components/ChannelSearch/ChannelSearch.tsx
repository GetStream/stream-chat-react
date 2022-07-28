import React from 'react';

import {
  AdditionalSearchInputProps,
  SearchInput as DefaultSearchInput,
  SearchInputProps,
} from './SearchInput';
import { AdditionalSearchResultsProps, SearchResults } from './SearchResults';

import type { DefaultStreamChatGenerics } from '../../types/types';
import type { SearchController } from './hooks/useChannelSearch';

export type AdditionalChannelSearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = AdditionalSearchInputProps &
  AdditionalSearchResultsProps<StreamChatGenerics> & {
    /** Custom UI component to display the search text input */
    SearchInput?: React.ComponentType<SearchInputProps>;
  };

export type ChannelSearchProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = AdditionalChannelSearchProps<StreamChatGenerics> & SearchController<StreamChatGenerics>;

const UnMemoizedChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelSearchProps<StreamChatGenerics>,
) => {
  const {
    clearState,
    SearchResultsList,
    inputRef,
    onSearch,
    placeholder,
    popupResults = false,
    query,
    results,
    SearchEmpty,
    searching,
    SearchInput = DefaultSearchInput,
    SearchLoading,
    SearchResultItem,
    SearchResultsHeader,
    selectResult,
  } = props;

  return (
    <div className='str-chat__channel-search' data-testid='channel-search'>
      <SearchInput
        clearState={clearState}
        inputRef={inputRef}
        onSearch={onSearch}
        placeholder={placeholder}
        query={query}
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
