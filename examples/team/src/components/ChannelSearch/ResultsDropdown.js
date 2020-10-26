import React from 'react';
import { Avatar } from 'stream-chat-react';

const SearchResult = ({ channel, focusedId, setChannel, type }) => {
  if (type === 'channel') {
    return (
      <div
        onClick={() => setChannel(channel)}
        className={
          focusedId === channel.id
            ? 'channel-search__result-container__focused'
            : 'channel-search__result-container'
        }
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
      className={
        focusedId === channel.id
          ? 'channel-search__result-container__focused'
          : 'channel-search__result-container'
      }
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

export const ResultsDropdown = ({
  teamChannels,
  directChannels,
  focusedId,
  loading,
  setChannel,
  setQuery,
}) => {
  document.addEventListener('click', () => setQuery(''));

  return (
    <div className="channel-search__results">
      <p className="channel-search__results-header">Channels</p>
      {loading && !teamChannels.length && (
        <p className="channel-search__results-header">
          <i>Loading...</i>
        </p>
      )}
      {!loading && !teamChannels.length ? (
        <p className="channel-search__results-header">
          <i>No channels found</i>
        </p>
      ) : (
        teamChannels.map((channel, i) => (
          <SearchResult
            channel={channel}
            focusedId={focusedId}
            key={i}
            setChannel={setChannel}
            type="channel"
          />
        ))
      )}
      <p className="channel-search__results-header">Users</p>
      {loading && !directChannels.length && (
        <p className="channel-search__results-header">
          <i>Loading...</i>
        </p>
      )}
      {!loading && !directChannels.length ? (
        <p className="channel-search__results-header">
          <i>No direct messages found</i>
        </p>
      ) : (
        directChannels.map((channel, i) => (
          <SearchResult
            channel={channel}
            focusedId={focusedId}
            key={i}
            setChannel={setChannel}
            type="user"
          />
        ))
      )}
    </div>
  );
};
