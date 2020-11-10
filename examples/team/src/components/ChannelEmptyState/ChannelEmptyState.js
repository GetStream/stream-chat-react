import React, { useContext } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';

import './ChannelEmptyState.css';

export const ChannelEmptyState = () => {
  const { channel, client } = useContext(ChatContext);

  const getUserText = () => {
    const members = Object.values(channel.state.members).filter(
      ({ user }) => user.id !== client.userID,
    );

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
        {memberString || 'anyone'}
      </span>
    );
  };

  return (
    <div className="channel-empty__container">
      <div className="channel-empty__image-wrapper">
        <Avatar size={72} />
      </div>
      <p className="channel-empty__first">
        This is the beginning of your chat history{' '}
        {channel.type === 'team' ? 'channel name' : getUserText()}.
      </p>
      <p className="channel-empty__second">
        Send messages, attachments, links, emojis, and more.
      </p>
    </div>
  );
};
