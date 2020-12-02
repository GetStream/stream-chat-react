import React, { useContext } from 'react';
import { Avatar, ChannelContext, ChatContext } from 'stream-chat-react';

import './TeamChannelHeader.css';

import { ChannelInfo, PinIcon } from '../../assets';

export const TeamChannelHeader = ({ setIsEditing, setPinsOpen }) => {
  const { client } = useContext(ChatContext);
  const { channel, closeThread, watcher_count } = useContext(ChannelContext);

  const teamHeader = `# ${channel.data.name || channel.data.id || 'random'}`;

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
                {addComma && ','}
              </p>
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
        <div className="team-channel-header__channel-wrapper">
          <p className="team-channel-header__name">{teamHeader}</p>
          <span style={{ display: 'flex' }} onClick={() => setIsEditing(true)}>
            <ChannelInfo />
          </span>
        </div>
      )}
      <div className="team-channel-header__right">
        <p className="team-channel-header__right-text">
          {getWatcherText(watcher_count)}
        </p>
        <div
          className="team-channel-header__right-pin-wrapper"
          onClick={(e) => {
            closeThread(e);
            setPinsOpen((prevState) => !prevState);
          }}
        >
          <PinIcon />
          <p className="team-channel-header__right-text">Pins</p>
        </div>
      </div>
    </div>
  );
};
