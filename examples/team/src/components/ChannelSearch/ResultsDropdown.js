import React, { useContext } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';

const SearchResult = ({ channel, focusedId, setChannel, type }) => {
  const { client, setActiveChannel } = useContext(ChatContext);

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

  return (
    <div
      onClick={async () => {
        const [existingChannel] = await client.queryChannels({
          type: 'messaging',
          member_count: 2,
          members: { $eq: [channel.id, client.userID] },
        });

        if (existingChannel) {
          return setActiveChannel(existingChannel);
        }

        const newChannel = await client.channel('messaging', {
          members: [channel.id, client.userID],
        });

        return setActiveChannel(newChannel);
      }}
      className={
        focusedId === channel.id
          ? 'channel-search__result-container__focused'
          : 'channel-search__result-container'
      }
    >
      <div className="channel-search__result-user">
        <Avatar image={channel.image || undefined} size={24} />
        <p className="channel-search__result-text">
          {channel.name || 'Johnny Blaze'}
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
