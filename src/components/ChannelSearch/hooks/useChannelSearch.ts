import React, { useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import { ChannelOrUserResponse, isChannel } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserFilters,
  UserOptions,
  UserSort,
} from 'stream-chat';

import type { SearchInputController } from '../SearchInput';
import type { SearchResultsController } from '../SearchResults';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type ChannelSearchFunctionParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse<StreamChatGenerics>[]>>;
  setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchController<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = SearchInputController & SearchResultsController<StreamChatGenerics>;

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

export type ChannelSearchParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  channelType?: string;
  /** Clear search state / results on every click outside the search input, defaults to true */
  clearSearchOnClickOutside?: boolean;
  /** Search can be enabled, defaults to false */
  enabled?: boolean;
  /** Custom handler function to run on search result item selection */
  onSelectResult?: (
    params: ChannelSearchFunctionParams<StreamChatGenerics>,
    result: ChannelOrUserResponse<StreamChatGenerics>,
  ) => Promise<void> | void;
  /** Boolean to search for channels as well as users in the server query, default is false and just searches for users */
  searchForChannels?: boolean;
  /** Custom search function to override the default implementation */
  searchFunction?: (
    params: ChannelSearchFunctionParams<StreamChatGenerics>,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
  /** Object containing filters/sort/options overrides for user search */
  searchQueryParams?: SearchQueryParams<StreamChatGenerics>;
};

export const useChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channelType = 'messaging',
  clearSearchOnClickOutside = true,
  enabled = false,
  onSelectResult,
  searchForChannels = false,
  searchFunction,
  searchQueryParams,
}: ChannelSearchParams<StreamChatGenerics>): SearchController<StreamChatGenerics> => {
  const { client, setActiveChannel } = useChatContext<StreamChatGenerics>('useChannelSearch');

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
    if (!enabled) return;

    const clickListener = (event: MouseEvent) => {
      if (resultsOpen && event.target instanceof HTMLElement) {
        const isInputClick = inputRef.current?.contains(event.target);
        if (!isInputClick && clearSearchOnClickOutside) {
          clearState();
        }
      }
    };

    document.addEventListener('click', clickListener);
    return () => document.removeEventListener('click', clickListener);
  }, [resultsOpen]);

  const selectResult = async (result: ChannelOrUserResponse<StreamChatGenerics>) => {
    if (!client.userID) return;
    if (onSelectResult) {
      await onSelectResult(
        {
          setQuery,
          setResults,
          setResultsOpen,
          setSearching,
        },
        result,
      );
      return;
    }

    if (isChannel(result)) {
      setActiveChannel(result);
    } else {
      const newChannel = client.channel(channelType, { members: [client.userID, result.id] });
      await newChannel.watch();

      setActiveChannel(newChannel);
    }
    if (clearSearchOnClickOutside) {
      clearState();
    }
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
    if (!enabled) return;

    if (searchFunction) {
      searchFunction(
        {
          setQuery,
          setResults,
          setResultsOpen,
          setSearching,
        },
        event,
      );
    } else {
      setQuery(event.target.value);
      getChannelsThrottled(event.target.value);
    }
  };

  return {
    clearState,
    inputRef,
    onSearch,
    query,
    results,
    searching,
    selectResult,
  };
};
