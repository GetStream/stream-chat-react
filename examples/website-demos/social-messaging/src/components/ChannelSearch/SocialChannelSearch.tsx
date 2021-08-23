import React, { useEffect, useState } from 'react';
import { Channel, UserResponse } from 'stream-chat';
import {
  ChannelSearch,
  isChannel,
  SearchInputProps,
  SearchQueryParams,
  useChatContext,
} from 'stream-chat-react';

// import { SkeletonLoader } from './DMChannelList';
// import { SearchResult } from './SearchResult';

import { SearchIcon } from '../../assets';

import {
  SocialAttachmentType,
  SocialChannelType,
  SocialCommandType,
  SocialEventType,
  SocialMessageType,
  SocialReactionType,
  SocialUserType,
} from '../ChatContainer/ChatContainer';

// type Props = {
//   setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
//   setParticipantProfile: React.Dispatch<React.SetStateAction<UserResponse | undefined>>;
//   setSearching: React.Dispatch<React.SetStateAction<boolean>>;
// };

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

  // const { setQuery } = channelSearchParams;

  return (
    <div className='social-search-input'>
      <SearchIcon />
      <input onChange={onSearch} placeholder='Search' ref={inputRef} type='text' value={query} />
      {/* <ClearSearchButton setQuery={setQuery} /> */}
    </div>
  );
};

const SearchLoading: React.FC = () => <div className='search-loading'>Loading participants...</div>;
const SearchEmpty: React.FC = () => <div className='search-empty'>No participants found</div>;

export const SocialChannelSearch: React.FC = () => {
  const { client } = useChatContext();

  // const [participants, setParticipants] = useState<UserResponse[]>();
  // const [querying, setQuerying] = useState(false);

  const handleSelectResult = async (result: Channel | UserResponse) => {
    if (isChannel(result)) return;
    // setParticipantProfile(result);
    // setSearching(false);
  };

  const searchQueryParams: SearchQueryParams = {
    channelFilters: {
      filters: { members: { $in: [client.userID || ''] } },
    },
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
        onSelectResult={handleSelectResult}
        searchQueryParams={searchQueryParams}
        searchForChannels={true}
        SearchEmpty={SearchEmpty}
        SearchInput={SearchInput}
        SearchLoading={SearchLoading}
        // DropdownContainer
        // SearchResultItem={SearchResult}
      />
    </div>
  );
};
