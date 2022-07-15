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

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type ChannelSearchFunctionParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse<StreamChatGenerics>[]>>;
  setResultsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchControllerState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channelSearchParams: ChannelSearchFunctionParams<StreamChatGenerics>;
  inputRef: React.RefObject<HTMLInputElement>;
  onSearch: (event: React.BaseSyntheticEvent) => void;
  query: string;
  results: ChannelOrUserResponse<StreamChatGenerics>[];
  searching: boolean;
  selectResult: (result: ChannelOrUserResponse<StreamChatGenerics>) => Promise<void> | void;
};

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

type UseChannelSearchParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  channelType: string;
  /** */
  disabled?: boolean;
  /** Boolean to search for channels as well as users in the server query, default is false and just searches for users */
  searchForChannels?: boolean;
  /** Object containing filters/sort/options overrides for user search */
  searchQueryParams?: SearchQueryParams<StreamChatGenerics>;
};

export const useChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channelType,
  disabled = false,
  searchForChannels,
  searchQueryParams,
}: UseChannelSearchParams<StreamChatGenerics>): SearchControllerState<StreamChatGenerics> => {
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
    if (disabled) return;

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
  return {
    channelSearchParams,
    inputRef,
    onSearch,
    query,
    results,
    searching,
    selectResult,
  };
};
