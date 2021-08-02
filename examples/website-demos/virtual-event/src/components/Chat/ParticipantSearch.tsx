import React, { useEffect, useState } from 'react';
import { Channel, UserResponse } from 'stream-chat';
import {
  Avatar,
  ChannelSearch,
  isChannel,
  SearchInputProps,
  SearchQueryParams,
  SearchResultItemProps,
  useChatContext,
} from 'stream-chat-react';

import './ParticipantSearch.scss';

import { ClearSearchButton, CloseX, SearchIcon } from '../../assets';
import {
  AttachmentType,
  ChannelType,
  CommandType,
  EventType,
  MessageType,
  ReactionType,
  UserType,
} from '../../hooks/useInitChat';

type Props = {
  setDmChannel: React.Dispatch<React.SetStateAction<Channel | undefined>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchInput: React.FC<SearchInputProps> = (props) => {
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

const SearchResultItem: React.FC<
  SearchResultItemProps<
    AttachmentType,
    ChannelType,
    CommandType,
    EventType,
    MessageType,
    ReactionType,
    UserType
  >
> = (props) => {
  const { focusedUser, index, result, selectResult } = props;

  const focused = focusedUser === index;

  if (isChannel(result)) return null;

  return (
    <div
      className={`search-result ${focused ? 'focused' : ''}`}
      onClick={() => selectResult(result)}
    >
      <Avatar image={result.image} name={result.name || result.id} user={result} />
      <div className='search-result-info'>
        <div className='search-result-info-name'>{result.name || result.id}</div>
        <div className='search-result-info-title'>{result.title || 'Attendee'}</div>
      </div>
    </div>
  );
};

const SearchLoading: React.FC = () => <div className='search-loading'>Loading participants...</div>;
const SearchEmpty: React.FC = () => <div className='search-empty'>No participants found</div>;

export const ParticipantSearch: React.FC<Props> = (props) => {
  const { setDmChannel, setSearching } = props;

  const [participants, setParticipants] = useState<UserResponse[]>();

  const { client } = useChatContext();

  useEffect(() => {
    const getParticipants = async () => {
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
    };

    getParticipants();
  }, []); // eslint-disable-line

  const handleSelectResult = async (result: Channel | UserResponse) => {
    if (!client.userID || isChannel(result)) return;

    try {
      const newChannel = client.channel('messaging', { members: [client.userID, result.id] });
      await newChannel.watch();

      setDmChannel(newChannel);
    } catch (err) {
      console.log(err);
    }

    setSearching(false);
  };

  const extraParams: SearchQueryParams = {
    options: { limit: 20 },
  };

  return (
    <div className='search'>
      <div className='search-header'>
        <div className='search-header-close' onClick={() => setSearching(false)}>
          <CloseX />
        </div>
        <div className='search-header-title'>Participants</div>
      </div>
      <ChannelSearch
        onSelectResult={handleSelectResult}
        searchQueryParams={extraParams}
        SearchEmpty={SearchEmpty}
        SearchInput={SearchInput}
        SearchLoading={SearchLoading}
        SearchResultItem={SearchResultItem}
      />
      {participants?.length &&
        participants.map((participant, i) => (
          <SearchResultItem index={i} result={participant} selectResult={handleSelectResult} />
        ))}
    </div>
  );
};
