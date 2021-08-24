import React from 'react';
import {
  ChannelSearch,
  SearchInputProps,
  useChatContext,
} from 'stream-chat-react';

import { SearchIcon } from '../../assets';
import { SearchResultItem } from './SearchResultItem';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

const SearchInput: React.FC<
  SearchInputProps<
    SocialAttachmentType,
    SocialChannelType,
    SocialCommandType,
    SocialEventType,
    SocialMessageType,
    SocialReactionType,
    SocialUserType
  >
> = (props) => {
  const { inputRef, onSearch, query } = props;

  return (
    <div className='social-search-input'>
      <SearchIcon />
      <input onChange={onSearch} placeholder='Search' ref={inputRef} type='text' value={query} />
      {/* <ClearSearchButton setQuery={setQuery} /> */}
    </div>
  );
};

const SearchLoading: React.FC = () => <div className='search-loading'>Loading results...</div>;
const SearchEmpty: React.FC = () => <div className='search-empty'>No results found.</div>;

export const SocialChannelSearch: React.FC = () => {
  const { client } = useChatContext();

  const channelFilters = {
    filters: { members: { $in: [client.userID || ''] } },
  };

  return (
    <div className='search'>
      <ChannelSearch<
        SocialAttachmentType,
        SocialChannelType,
        SocialCommandType,
        SocialEventType,
        SocialMessageType,
        SocialReactionType,
        SocialUserType
      >
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
