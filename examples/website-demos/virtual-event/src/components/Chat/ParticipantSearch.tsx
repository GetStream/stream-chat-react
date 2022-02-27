import React, { useEffect, useState } from 'react';
import { Channel, UserResponse } from 'stream-chat';
import {
  ChannelSearch,
  isChannel,
  SearchInputProps,
  SearchQueryParams,
  useChatContext,
} from 'stream-chat-react';

import { SkeletonLoader } from './DMChannelList';
import { SearchResult } from './SearchResult';

import { ClearSearchButton, CloseX, SearchIcon } from '../../assets';

import type { StreamChatGenerics } from '../../types';

type Props = {
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
  setParticipantProfile: React.Dispatch<React.SetStateAction<UserResponse | undefined>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchInput: React.FC<SearchInputProps<StreamChatGenerics>> = (props) => {
  const { channelSearchParams, inputRef, onSearch, query } = props;

  const { setQuery } = channelSearchParams;

  return (
    <div className='search-input'>
      <SearchIcon />
      <input onChange={onSearch} placeholder='Search' ref={inputRef} type='text' value={query} />
      <ClearSearchButton setQuery={setQuery} />
    </div>
  );
};

const SearchLoading: React.FC = () => <div className='search-loading'>Loading participants...</div>;
const SearchEmpty: React.FC = () => <div className='search-empty'>No participants found</div>;

export const ParticipantSearch: React.FC<Props> = (props) => {
  const { setParticipantProfile, setSearching } = props;

  const { client } = useChatContext();

  const [participants, setParticipants] = useState<UserResponse[]>();
  const [querying, setQuerying] = useState(false);

  useEffect(() => {
    const getParticipants = async () => {
      if (querying) return;
      setQuerying(true);

      try {
        const { users } = await client.queryUsers(
          { id: { $ne: client.userID || '' } },
          { id: 1, last_active: -1 },
          { limit: 10 },
        );

        if (users.length) setParticipants(users);
      } catch (err) {
        console.log(err);
      }

      setQuerying(false);
    };

    getParticipants();
  }, []); // eslint-disable-line

  const handleSelectResult = async (result: Channel | UserResponse) => {
    if (isChannel(result)) return;
    setParticipantProfile(result);
    setSearching(false);
  };

  const extraParams: SearchQueryParams = {
    userFilters: {
      options: { limit: 20 },
    },
  };

  return (
    <div className='search'>
      <div className='search-header'>
        <div className='search-header-close' onClick={() => setSearching(false)}>
          <CloseX />
        </div>
        <div className='search-header-title'>Participants</div>
      </div>
      <ChannelSearch<StreamChatGenerics>
        onSelectResult={handleSelectResult}
        searchQueryParams={extraParams}
        SearchEmpty={SearchEmpty}
        SearchInput={SearchInput}
        SearchLoading={SearchLoading}
        SearchResultItem={SearchResult}
      />
      {querying ? (
        <SkeletonLoader />
      ) : (
        participants?.length &&
        participants.map((participant, i) => (
          <SearchResult index={i} key={i} result={participant} selectResult={handleSelectResult} />
        ))
      )}
    </div>
  );
};
