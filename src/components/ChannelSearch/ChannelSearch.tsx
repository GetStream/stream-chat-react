import React, { useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import {
  ChannelSearchFunctionParams,
  SearchInput as DefaultSearchInput,
  SearchInputProps,
} from './SearchInput';
import { DropdownContainerProps, SearchResultItemProps, SearchResults } from './SearchResults';

import { ChannelOrUserResponse, isChannel } from './utils';

import { useChatContext } from '../../context/ChatContext';

import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserFilters,
  UserOptions,
  UserSort,
} from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type SearchQueryParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channelFilters?: {
    filters?: ChannelFilters<StreamChatGenerics>;
    options?: ChannelOptions;
    sort?: ChannelSort<StreamChatGenerics>;
  };
  userFilters?: {
    filters?: UserFilters<StreamChatGenerics>;
    options?: UserOptions;
    sort?: UserSort<StreamChatGenerics>;
  };
};

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
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Boolean to search for channels as well as users in the server query, default is false and just searches for users */
  searchForChannels?: boolean;
  /** Custom search function to override default */
  searchFunction?: (
    params: ChannelSearchFunctionParams<StreamChatGenerics>,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
  /** Custom UI component to display the search text input */
  SearchInput?: React.ComponentType<SearchInputProps<StreamChatGenerics>>;
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
    SearchInput = DefaultSearchInput,
    SearchLoading,
    searchQueryParams,
    SearchResultItem,
    SearchResultsHeader,
  } = props;

  const { client, setActiveChannel } = useChatContext<StreamChatGenerics>('ChannelSearch');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<ChannelOrUserResponse<StreamChatGenerics>>>([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const clearState = () => {
    setQuery('');
    setResults([]);
    setResultsOpen(false);
    setSearching(false);
  };

  useEffect(() => {
    const clickListener = (event: MouseEvent) => {
      if (resultsOpen && event.target instanceof HTMLElement) {
        const isInputClick = inputRef.current?.contains(event.target);
        if (!isInputClick) {
          clearState();
        }
      }
    };

    document.addEventListener('click', clickListener);
    return () => document.removeEventListener('click', clickListener);
  }, [resultsOpen]);

  const selectResult = async (result: ChannelOrUserResponse<StreamChatGenerics>) => {
    if (!client.userID) return;

    if (isChannel(result)) {
      setActiveChannel(result);
    } else {
      const newChannel = client.channel(channelType, { members: [client.userID, result.id] });
      await newChannel.watch();

      setActiveChannel(newChannel);
    }
    clearState();
  };

  const getChannels = async (text: string) => {
    if (!text || searching) return;
    setSearching(true);

    try {
      const userResponse = await client.queryUsers(
        // @ts-expect-error
        {
          $or: [{ id: { $autocomplete: text } }, { name: { $autocomplete: text } }],
          id: { $ne: client.userID },
          ...searchQueryParams?.userFilters?.filters,
        },
        { id: 1, ...searchQueryParams?.userFilters?.sort },
        { limit: 8, ...searchQueryParams?.userFilters?.options },
      );

      if (searchForChannels) {
        const channelResponse = client.queryChannels(
          // @ts-expect-error
          {
            name: { $autocomplete: text },
            ...searchQueryParams?.channelFilters?.filters,
          },
          searchQueryParams?.channelFilters?.sort || {},
          { limit: 5, ...searchQueryParams?.channelFilters?.options },
        );

        const [channels, { users }] = await Promise.all([channelResponse, userResponse]);

        setResults([...channels, ...users]);
        setResultsOpen(true);
        setSearching(false);
        return;
      }

      const { users } = await Promise.resolve(userResponse);

      setResults(users);
      setResultsOpen(true);
    } catch (error) {
      clearState();
      console.error(error);
    }

    setSearching(false);
  };

  const getChannelsThrottled = throttle(getChannels, 200);

  const onSearch = (event: React.BaseSyntheticEvent) => {
    event.preventDefault();
    setQuery(event.target.value);
    getChannelsThrottled(event.target.value);
  };

  const channelSearchParams = {
    setQuery,
    setResults,
    setResultsOpen,
    setSearching,
  };

  return (
    <div className='str-chat__channel-search' data-testid='channel-search'>
      <SearchInput
        channelSearchParams={channelSearchParams}
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
