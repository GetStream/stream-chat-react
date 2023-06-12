import React, { useCallback, useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';
import uniqBy from 'lodash.uniqby';

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

import type { Channel } from 'stream-chat';
import type { SearchBarController } from '../SearchBar';
import type { SearchInputController } from '../SearchInput';
import type { SearchResultsController } from '../SearchResults';
import type { DefaultStreamChatGenerics } from '../../../types/types';

export type ChannelSearchFunctionParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse<StreamChatGenerics>[]>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchController<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = SearchInputController & SearchBarController & SearchResultsController<StreamChatGenerics>;

export type SearchQueryParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  channelFilters?: {
    filters?: ChannelFilters<StreamChatGenerics>;
    options?: ChannelOptions;
    sort?: ChannelSort<StreamChatGenerics>;
  };
  userFilters?: {
    filters?:
      | UserFilters<StreamChatGenerics>
      | ((query: string) => UserFilters<StreamChatGenerics>);
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
  /** Disables execution of the search queries, defaults to false */
  disabled?: boolean;
  /** Callback invoked with every search input change handler */
  onSearch?: SearchInputController['onSearch'];
  /** Callback invoked when the search UI is deactivated */
  onSearchExit?: () => void;
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
  /** Object containing filters/sort/options overrides for user / channel search */
  searchQueryParams?: SearchQueryParams<StreamChatGenerics>;
};

export type ChannelSearchControllerParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ChannelSearchParams<StreamChatGenerics> & {
  /** Set the array of channels displayed in the ChannelList */
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<StreamChatGenerics>>>>;
};

export const useChannelSearch = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  channelType = 'messaging',
  clearSearchOnClickOutside = true,
  disabled = false,
  onSearch: onSearchCallback,
  onSearchExit,
  onSelectResult,
  searchForChannels = false,
  searchFunction,
  searchQueryParams,
  setChannels,
}: ChannelSearchControllerParams<StreamChatGenerics>): SearchController<StreamChatGenerics> => {
  const { client, navOpen, setActiveChannel, themeVersion } = useChatContext<StreamChatGenerics>(
    'useChannelSearch',
  );

  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<ChannelOrUserResponse<StreamChatGenerics>>>([]);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const clearState = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearching(false);
  }, []);

  const activateSearch = useCallback(() => {
    setInputIsFocused(true);
  }, []);

  const exitSearch = useCallback(() => {
    setInputIsFocused(false);
    inputRef.current?.blur();
    clearState();
    onSearchExit?.();
  }, [clearState, onSearchExit]);

  useEffect(() => {
    if (disabled) return;

    const clickListener = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const isInputClick =
        themeVersion === '2'
          ? searchBarRef.current?.contains(event.target)
          : inputRef.current?.contains(event.target);

      if (isInputClick) return;

      if ((inputIsFocused && (!query || navOpen)) || clearSearchOnClickOutside) {
        exitSearch();
      }
    };

    document.addEventListener('click', clickListener);
    return () => document.removeEventListener('click', clickListener);
  }, [disabled, inputIsFocused, query, exitSearch, navOpen, clearSearchOnClickOutside]);

  useEffect(() => {
    if (!inputRef.current || disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return exitSearch();
    };
    inputRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      inputRef.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled]);

  const selectResult = useCallback(
    async (result: ChannelOrUserResponse<StreamChatGenerics>) => {
      if (!client.userID) return;
      if (onSelectResult) {
        await onSelectResult(
          {
            setQuery,
            setResults,
            setSearching,
          },
          result,
        );
        return;
      }
      let selectedChannel: Channel<StreamChatGenerics>;
      if (isChannel(result)) {
        setActiveChannel(result);
        selectedChannel = result;
      } else {
        const newChannel = client.channel(channelType, { members: [client.userID, result.id] });
        await newChannel.watch();

        setActiveChannel(newChannel);
        selectedChannel = newChannel;
      }
      setChannels((channels) => uniqBy([selectedChannel, ...channels], 'cid'));
      if (clearSearchOnClickOutside) {
        exitSearch();
      }
    },
    [clearSearchOnClickOutside, client, exitSearch, onSelectResult, setActiveChannel, setChannels],
  );

  const getChannels = useCallback(
    async (text: string) => {
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
          setSearching(false);
          return;
        }

        const { users } = await Promise.resolve(userResponse);

        setResults(users);
      } catch (error) {
        clearState();
        console.error(error);
      }

      setSearching(false);
    },
    [client, searching, searchForChannels],
  );

  const getChannelsThrottled = throttle(getChannels, 200);

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (disabled) return;

      if (searchFunction) {
        searchFunction(
          {
            setQuery,
            setResults,
            setSearching,
          },
          event,
        );
      } else {
        setQuery(event.target.value);
        getChannelsThrottled(event.target.value);
      }
      onSearchCallback?.(event);
    },
    [disabled, getChannelsThrottled, onSearchCallback, searchFunction],
  );

  return {
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
  };
};
