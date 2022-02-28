import React from 'react';
import { ChannelSearch, SearchInputProps, useChatContext } from 'stream-chat-react';

import { ClearSearch, SearchIcon } from '../../assets';
import { SearchResultItem } from './SearchResultItem';

import { StreamChatGenerics } from '../../types';

import './SocialChannelSearch.scss';

import type { ChannelFilters } from 'stream-chat';

const SearchInput = (props: SearchInputProps<StreamChatGenerics>) => {
  const { channelSearchParams, inputRef, onSearch, query } = props;

  return (
    <div className='search-social-input'>
      <SearchIcon />
      <input onChange={onSearch} placeholder='Search' ref={inputRef} type='text' value={query} />
      {query && (
        <div className='search-social-input-close'>
          <ClearSearch setQuery={channelSearchParams.setQuery} />
        </div>
      )}
    </div>
  );
};

const SearchLoading: React.FC = () => <div className='search-loading'>Loading results...</div>;
const SearchEmpty: React.FC = () => <div className='search-empty'>No results found.</div>;

export const SocialChannelSearch: React.FC = () => {
  const { client } = useChatContext();

  const channelFilters: { filters: ChannelFilters } = {
    filters: { members: { $in: [client.userID || ''] } },
  };

  return (
    <div className='search'>
      <ChannelSearch
        searchForChannels={true}
        searchQueryParams={{
          channelFilters,
        }}
        SearchEmpty={SearchEmpty}
        SearchInput={SearchInput}
        SearchLoading={SearchLoading}
        SearchResultItem={SearchResultItem}
      />
    </div>
  );
};
