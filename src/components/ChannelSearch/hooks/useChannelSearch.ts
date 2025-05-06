import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import uniqBy from 'lodash.uniqby';

import type { ChannelOrUserResponse } from '../utils';
import { isChannel } from '../utils';

import { useChatContext } from '../../../context/ChatContext';

import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserFilters,
  UserOptions,
  UsersAPIResponse,
  UserSort,
} from 'stream-chat';
import type { SearchBarController } from '../SearchBar';
import type { SearchInputController } from '../SearchInput';
import type { SearchResultsController } from '../SearchResults';

export type ChannelSearchFunctionParams = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse[]>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchController = SearchInputController &
  SearchBarController &
  SearchResultsController;

export type SearchQueryParams = {
  channelFilters?: {
    filters?: ChannelFilters;
    options?: ChannelOptions;
    sort?: ChannelSort;
  };
  userFilters?: {
    filters?: UserFilters | ((query: string) => UserFilters);
    options?: UserOptions;
    sort?: UserSort;
  };
};

export type ChannelSearchParams = {
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
    params: ChannelSearchFunctionParams,
    result: ChannelOrUserResponse,
  ) => Promise<void> | void;
  /** The number of milliseconds to debounce the search query. The default interval is 200ms. */
  searchDebounceIntervalMs?: number;
  /** Boolean to search for channels in the server query, default is false and just searches for users */
  searchForChannels?: boolean;
  /** Boolean to search for users in the server query, default is true and just searches for users */
  searchForUsers?: boolean;
  /** Custom search function to override the default implementation */
  searchFunction?: (
    params: ChannelSearchFunctionParams,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
  /** Object containing filters/sort/options overrides for user / channel search */
  searchQueryParams?: SearchQueryParams;
};

export type ChannelSearchControllerParams = ChannelSearchParams & {
  /** Set the array of channels displayed in the ChannelList */
  setChannels?: React.Dispatch<React.SetStateAction<Array<Channel>>>;
};

export const useChannelSearch = ({
  channelType = 'messaging',
  clearSearchOnClickOutside = true,
  disabled = false,
  onSearch: onSearchCallback,
  onSearchExit,
  onSelectResult,
  searchDebounceIntervalMs = 300,
  searchForChannels = false,
  searchForUsers = true,
  searchFunction,
  searchQueryParams,
  setChannels,
}: ChannelSearchControllerParams): SearchController => {
  const { client, setActiveChannel } = useChatContext('useChannelSearch');

  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<ChannelOrUserResponse>>([]);
  const [searching, setSearching] = useState(false);

  const searchQueryPromiseInProgress = useRef<boolean>(false);
  const shouldIgnoreQueryResults = useRef(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);

  const clearState = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearching(false);

    shouldIgnoreQueryResults.current = searchQueryPromiseInProgress.current;
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
      const isInputClick = searchBarRef.current?.contains(event.target);

      if (isInputClick) return;

      if ((inputIsFocused && !query) || clearSearchOnClickOutside) {
        exitSearch();
      }
    };

    document.addEventListener('click', clickListener);
    return () => document.removeEventListener('click', clickListener);
  }, [disabled, inputIsFocused, query, exitSearch, clearSearchOnClickOutside]);

  useEffect(() => {
    if (!inputRef.current || disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return exitSearch();
    };
    inputRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      inputRef.current?.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  const selectResult = useCallback(
    async (result: ChannelOrUserResponse) => {
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
      let selectedChannel: Channel;
      if (isChannel(result)) {
        setActiveChannel(result);
        selectedChannel = result;
      } else {
        const newChannel = client.channel(channelType, {
          members: [client.userID, result.id],
        });
        await newChannel.watch();

        setActiveChannel(newChannel);
        selectedChannel = newChannel;
      }
      setChannels?.((channels) => uniqBy([selectedChannel, ...channels], 'cid'));
      if (clearSearchOnClickOutside) {
        exitSearch();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clearSearchOnClickOutside,
      client,
      exitSearch,
      onSelectResult,
      setActiveChannel,
      setChannels,
    ],
  );

  const getChannels = useCallback(
    async (text: string) => {
      if (!searchForChannels && !searchForUsers) return;
      let results: ChannelOrUserResponse[] = [];
      const promises: Array<Promise<Channel[]> | Promise<UsersAPIResponse>> = [];
      try {
        if (searchForChannels) {
          promises.push(
            client.queryChannels(
              {
                members: { $in: [client.userID as string] },
                name: { $autocomplete: text },
                ...searchQueryParams?.channelFilters?.filters,
              },
              searchQueryParams?.channelFilters?.sort || {},
              { limit: 5, ...searchQueryParams?.channelFilters?.options },
            ),
          );
        }

        if (searchForUsers) {
          promises.push(
            client.queryUsers(
              {
                $or: [{ id: { $autocomplete: text } }, { name: { $autocomplete: text } }],
                ...searchQueryParams?.userFilters?.filters,
              },
              { id: 1, ...searchQueryParams?.userFilters?.sort },
              { limit: 8, ...searchQueryParams?.userFilters?.options },
            ),
          );
        }

        if (promises.length) {
          searchQueryPromiseInProgress.current = true;

          const resolved = await Promise.all(promises);

          if (searchForChannels && searchForUsers) {
            const [channels, { users }] = resolved as [Channel[], UsersAPIResponse];
            results = [...channels, ...users.filter((u) => u.id !== client.user?.id)];
          } else if (searchForChannels) {
            const [channels] = resolved as [Channel[]];
            results = [...channels];
          } else if (searchForUsers) {
            const [{ users }] = resolved as [UsersAPIResponse];
            results = [...users.filter((u) => u.id !== client.user?.id)];
          }
        }
      } catch (error) {
        console.error(error);
      }
      setSearching(false);

      if (!shouldIgnoreQueryResults.current) {
        setResults(results);
      } else {
        shouldIgnoreQueryResults.current = false;
      }

      searchQueryPromiseInProgress.current = false;
    },
    [client, searchForChannels, searchForUsers, searchQueryParams],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scheduleGetChannels = useCallback(
    debounce(getChannels, searchDebounceIntervalMs),
    [getChannels, searchDebounceIntervalMs],
  );

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
      } else if (!searchForChannels && !searchForUsers) {
        return;
      } else if (event.target.value) {
        setSearching(true);
        setQuery(event.target.value);
        scheduleGetChannels(event.target.value);
      } else if (!event.target.value) {
        clearState();
        scheduleGetChannels.cancel();
      }
      onSearchCallback?.(event);
    },
    [
      clearState,
      disabled,
      scheduleGetChannels,
      onSearchCallback,
      searchForChannels,
      searchForUsers,
      searchFunction,
    ],
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
