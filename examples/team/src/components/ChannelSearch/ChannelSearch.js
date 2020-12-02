import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ChatContext } from 'stream-chat-react';
import _debounce from 'lodash.debounce';

import './ChannelSearch.css';

import { ResultsDropdown } from './ResultsDropdown';

import { SearchIcon } from '../../assets';

export const ChannelSearch = () => {
  const { client, setActiveChannel } = useContext(ChatContext);

  const [allChannels, setAllChannels] = useState([]);
  const [teamChannels, setTeamChannels] = useState([]);
  const [directChannels, setDirectChannels] = useState([]);

  const [focused, setFocused] = useState(undefined);
  const [focusedId, setFocusedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowDown') {
        setFocused((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === allChannels.length - 1 ? 0 : prevFocused + 1;
        });
      } else if (event.key === 'ArrowUp') {
        setFocused((prevFocused) => {
          if (prevFocused === undefined) return 0;
          return prevFocused === 0 ? allChannels.length - 1 : prevFocused - 1;
        });
      } else if (event.keyCode === 13) {
        event.preventDefault();
        setActiveChannel(allChannels[focused]);
        setFocused(undefined);
        setFocusedId('');
        setQuery('');
      }
    },
    [allChannels, focused, setActiveChannel],
  );

  useEffect(() => {
    if (query) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, query]);

  useEffect(() => {
    if (!query) {
      setTeamChannels([]);
      setDirectChannels([]);
    }
  }, [query]);

  useEffect(() => {
    if (focused >= 0) {
      setFocusedId(allChannels[focused]?.id);
    }
  }, [allChannels, focused]);

  const setChannel = (channel) => {
    setQuery('');
    setActiveChannel(channel);
  };

  const getChannels = async (text) => {
    try {
      const channelResponse = client.queryChannels(
        {
          type: 'team',
          name: { $autocomplete: text },
        },
        {},
        { limit: 6 },
      );

      const userResponse = client.queryUsers(
        { id: { $ne: client.userID }, name: { $autocomplete: text } },
        { id: 1 },
        { limit: 6 },
      );

      const [channels, { users }] = await Promise.all([
        channelResponse,
        userResponse,
      ]);

      setTeamChannels(channels);
      setDirectChannels(users);
      setAllChannels(channels.concat(users));
    } catch (e) {
      setQuery('');
      console.log(e);
    }

    setLoading(false);
  };

  const getChannelsDebounce = _debounce(getChannels, 100, {
    trailing: true,
  });

  const onSearch = (event) => {
    event.preventDefault();

    setLoading(true);
    setFocused(undefined);
    setQuery(event.target.value);
    if (!event.target.value) return;

    getChannelsDebounce(event.target.value);
  };

  return (
    <div className="channel-search__container">
      <div className="channel-search__input__wrapper">
        <div className="channel-search__input__icon">
          <SearchIcon />
        </div>
        <input
          className="channel-search__input__text"
          onChange={onSearch}
          placeholder="Search"
          type="text"
          value={query}
        />
      </div>
      {query && (
        <ResultsDropdown
          teamChannels={teamChannels}
          directChannels={directChannels}
          focusedId={focusedId}
          loading={loading}
          setChannel={setChannel}
          setQuery={setQuery}
        />
      )}
    </div>
  );
};
