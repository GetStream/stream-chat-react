import React, { useEffect, useRef, useState } from 'react';
import throttle from 'lodash.throttle';

import { SearchResultItemProps, SearchResults } from './SearchResults';

import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { UserFilters, UserOptions, UserResponse, UserSort } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type SearchQueryParams<Us extends DefaultUserType<Us> = DefaultUserType> = {
  filters?: UserFilters<Us>;
  options?: UserOptions;
  sort?: UserSort<Us>;
};

export type ChannelSearchProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  channelType?: string;
  /** Custom handler function to run on search result item selection */
  onSelectResult?: (user: UserResponse<Us>) => Promise<void> | void;
  /** Display search results as an absolutely positioned popup, defaults to false and shows inline */
  popupResults?: boolean;
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Custom search function to override default */
  searchFunction?: (event: React.BaseSyntheticEvent) => Promise<void> | void;
  /** Custom UI component to display the search loading state */
  SearchLoading?: React.ComponentType;
  /** Object containing filters/sort/options overrides for user search */
  searchQueryParams?: SearchQueryParams<Us>;
  /** Custom UI component to display a search result list item, defaults to and accepts same props as: [DefaultSearchResultItem](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx) */
  SearchResultItem?: React.ComponentType<SearchResultItemProps<Us>>;
  /** Custom UI component to display the search results header */
  SearchResultsHeader?: React.ComponentType;
};

const UnMemoizedChannelSearch = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelSearchProps<Us>,
) => {
  const {
    channelType = 'messaging',
    onSelectResult,
    popupResults = false,
    SearchEmpty,
    searchFunction,
    SearchLoading,
    searchQueryParams,
    SearchResultItem,
    SearchResultsHeader,
  } = props;

  const { client, setActiveChannel } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<UserResponse<Us>>>([]);
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

  const selectResult = async (user: UserResponse<Us>) => {
    if (!client.userID) return;

    // @ts-expect-error
    const newChannel = client.channel(channelType, { members: [client.userID, user.id] });
    await newChannel.watch();

    setActiveChannel(newChannel);
    clearState();
  };

  const getChannels = async (text: string) => {
    if (!text || searching) return;
    setSearching(true);

    try {
      const { users } = await client.queryUsers(
        // @ts-expect-error
        {
          $or: [{ id: { $autocomplete: text } }, { name: { $autocomplete: text } }],
          id: { $ne: client.userID },
          ...searchQueryParams?.filters,
        },
        { id: 1, ...searchQueryParams?.sort },
        { limit: 8, ...searchQueryParams?.options },
      );

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

  return (
    <div className='str-chat__channel-search'>
      <input
        onChange={searchFunction || onSearch}
        placeholder={t('Search')}
        ref={inputRef}
        type='text'
        value={query}
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
