import React, { useContext } from 'react';
import { Avatar, ChannelContext, ChatContext } from 'stream-chat-react';

import './TeamChannelHeader.css';

export const TeamChannelHeader = () => {
  const { client } = useContext(ChatContext);
  const { channel, watcher_count } = useContext(ChannelContext);

  const teamHeader = `# ${channel.data.id || 'random'}`;

  const getMessagingHeader = () => {
    const members = Object.values(channel.state.members).filter(
      ({ user }) => user.id !== client.userID,
    );
    const additionalMembers = members.length - 4;

    if (!members.length) {
      return (
        <div className="team-channel-header__name-wrapper">
          <Avatar image={null} size={32} />
          <p className="team-channel-header__name user">Johnny Blaze</p>
        </div>
      );
    }

    return (
      <div className="team-channel-header__name-wrapper">
        {members.map(({ user }, i) => {
          if (i > 3) return null;
          const addComma = members.length - 1 !== i && i < 3;
          return (
            <div key={i} className="team-channel-header__name-multi">
              <Avatar image={user.image} size={32} />
              <p className="team-channel-header__name user">
                {user.name || 'Johnny Blaze'}
              </p>
              {addComma && ','}
            </div>
          );
        })}
        {additionalMembers > 0 && (
          <p className="team-channel-header__name user">{`, and ${additionalMembers} more`}</p>
        )}
      </div>
    );
  };

  const getWatcherText = (watchers) => {
    if (!watchers) return 'No users online';
    if (watchers === 1) return '1 user online';
    return `${watchers} users online`;
  };

  return (
    <div className="team-channel-header__container">
      {channel.type === 'messaging' ? (
        getMessagingHeader()
      ) : (
        <p className="team-channel-header__name">{teamHeader}</p>
      )}
      <p className="team-channel-header__watchers">
        {getWatcherText(watcher_count)}
      </p>
    </div>
  );
};
