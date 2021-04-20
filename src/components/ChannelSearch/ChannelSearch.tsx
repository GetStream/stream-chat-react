import React, { useState } from 'react';
import throttle from 'lodash.throttle';

import { SearchResultProps, SearchResults } from './SearchResults';

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
} from '../../../types/types';

export type SearchQueryParams<Us extends DefaultUserType<Us> = DefaultUserType> = {
  filters?: UserFilters<Us>;
  options?: UserOptions;
  sort?: UserSort<Us>;
};

export type ChannelSearchProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  /** The type of channel to create on user result select, defaults to `messaging` */
  channelType?: string;
  /** Displays search results as an absolutely positioned popup, defaults to true */
  popupResults?: boolean;
  /** Custom UI component to display empty search results */
  SearchEmpty?: React.ComponentType;
  /** Custom search function to override default */
  searchFunction?: (event: React.BaseSyntheticEvent) => Promise<void> | void;
  /** Custom UI component to display the search loading state */
  SearchLoading?: React.ComponentType;
  /** Object containing filters/sort/options overrides for user search */
  searchQueryParams?: SearchQueryParams<Us>;
  /** Custom UI component to display a search result list item, defaults to and accepts same props as: [DefaultSearchResult](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelSearch/SearchResults.tsx) */
  SearchResult?: React.ComponentType<SearchResultProps<Us>>;
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
    popupResults = true,
    SearchEmpty,
    searchFunction,
    SearchLoading,
    searchQueryParams,
    SearchResult,
  } = props;

  const { client, setActiveChannel } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<UserResponse<Us>>>([]);
  const [searching, setSearching] = useState(false);

  const selectResult = async (user: UserResponse<Us>) => {
    if (!client.userID) return;

    // @ts-expect-error
    const newChannel = client.channel(channelType, { members: [client.userID, user.id] });

    await newChannel.watch();
    setActiveChannel(newChannel);

    setQuery('');
    setResults([]);
    setSearching(false);
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
    } catch (error) {
      setQuery('');
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
          SearchResult={SearchResult}
          selectResult={selectResult}
        />
      )}
    </div>
  );
};

export const ChannelSearch = React.memo(UnMemoizedChannelSearch) as typeof UnMemoizedChannelSearch;
