import React, { useContext, useEffect, useState } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';
import _debounce from 'lodash.debounce';

import './ChannelSearch.css';

import { SearchIcon } from '../../assets/SearchIcon';

const SearchResult = ({ channel, setChannel, type }) => {
  if (type === 'channel') {
    return (
      <div
        onClick={() => setChannel(channel)}
        className="channel-search__result-container"
      >
        <div className="result-hashtag">#</div>
        <p className="channel-search__result-text">{channel.data.name}</p>
      </div>
    );
  }

  const members = Object.values(channel.state.members);

  return (
    <div
      onClick={() => setChannel(channel)}
      className="channel-search__result-container"
    >
      <div className="channel-search__result-user">
        <Avatar image={members[0]?.user.image || undefined} size={24} />
        <p className="channel-search__result-text">
          {members[0]?.user.name || 'Johnny Blaze'}
        </p>
      </div>
    </div>
  );
};

const ResultsDropdown = ({
  teamChannels,
  directChannels,
  loading,
  setChannel,
  setQuery,
}) => {
  document.addEventListener('click', () => setQuery(''));

  return (
    <div className="channel-search__results">
      <p className="channel-search__results-header">Channels</p>
      {loading && (
        <p className="channel-search__results-header">
          <i>Loading...</i>
        </p>
      )}
      {!teamChannels.length && !loading && (
        <p className="channel-search__results-header">
          <i>No channels found</i>
        </p>
      )}
      {teamChannels.map((channel, i) => (
        <SearchResult
          channel={channel}
          key={i}
          setChannel={setChannel}
          type="channel"
        />
      ))}
      <p className="channel-search__results-header">Users</p>
      {loading && (
        <p className="channel-search__results-header">
          <i>Loading...</i>
        </p>
      )}
      {!directChannels.length && !loading && (
        <p className="channel-search__results-header">
          <i>No direct messages found</i>
        </p>
      )}
      {directChannels.map((channel, i) => (
        <SearchResult
          channel={channel}
          key={i}
          setChannel={setChannel}
          type="user"
        />
      ))}
    </div>
  );
};

export const ChannelSearch = () => {
  const { client, setActiveChannel } = useContext(ChatContext);

  const [teamChannels, setTeamChannels] = useState([]);
  const [directChannels, setDirectChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!query) {
      setTeamChannels([]);
      setDirectChannels([]);
    }
  }, [query]);

  const setChannel = (channel) => {
    setQuery('');
    setActiveChannel(channel);
  };

  const getChannels = async (text) => {
    try {
      const response = await client.queryChannels({
        name: { $autocomplete: text },
      });

      setTeamChannels(() => {
        return response.filter((channel) => channel.type === 'team');
      });

      setDirectChannels(() => {
        return response.filter((channel) => channel.type === 'messaging');
      });
    } catch (e) {
      setQuery('');
      console.log(e);
    }

    setLoading(false);
  };

  const getChannelsDebounce = _debounce(getChannels, 100, {
    trailing: true,
  });

  const onSearch = (e) => {
    e.preventDefault();

    setLoading(true);
    setQuery(e.target.value);
    if (!e.target.value) return;

    getChannelsDebounce(e.target.value);
  };

  return (
    <div className="channel-search__container">
      <div className="channel-search__input__wrapper">
        <div className="channel-search__input__icon">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search"
          onChange={onSearch}
          value={query}
          className="channel-search__input__text"
        />
      </div>
      {query && (
        <ResultsDropdown
          teamChannels={teamChannels}
          directChannels={directChannels}
          loading={loading}
          setChannel={setChannel}
          setQuery={setQuery}
        />
      )}
    </div>
  );
};
