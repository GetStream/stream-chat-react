import React, { useContext } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';

import './ChannelEmptyState.css';

import { HashIcon } from '../../assets';

export const ChannelEmptyState = () => {
  const { channel, client } = useContext(ChatContext);
  const members = Object.values(channel.state.members).filter(
    ({ user }) => user.id !== client.userID,
  );

  const getAvatarGroup = () => {
    if (!members.length) return <Avatar size={72} />;

    return (
      <div className="channel-empty__avatars">
        {members.map((member, i) => {
          if (i > 2) return null;
          return <Avatar key={i} image={member.user.image} size={72} />;
        })}
      </div>
    );
  };

  const getUserText = () => {
    if (members.length === 1) {
      return (
        <span className="channel-empty__user-name">{`@${members[0].user.name}`}</span>
      );
    }

    if (members.length === 2) {
      return (
        <span className="channel-empty__user-name">{`@${members[0].user.name} and @${members[1].user.name}`}</span>
      );
    }

    let memberString = '';

    members.forEach((member, i) => {
      if (i !== members.length - 1) {
        memberString = `${memberString}@${member.user.name}, `;
      } else {
        memberString = `${memberString} and @${member.user.name}`;
      }
    });

    return (
      <span className="channel-empty__user-name">
        {memberString || 'the Universe'}
      </span>
    );
  };

  return (
    <div className="channel-empty__container">
      {channel.type === 'team' ? <HashIcon /> : getAvatarGroup()}
      <p className="channel-empty__first">
        This is the beginning of your chat history
        {channel.type === 'team' ? ' in ' : ' with '}
        {channel.type === 'team'
          ? `#${channel.data.name || channel.data.id}`
          : getUserText()}
        .
      </p>
      <p className="channel-empty__second">
        Send messages, attachments, links, emojis, and more.
      </p>
    </div>
  );
};
