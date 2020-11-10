import React, { useContext } from 'react';
import { Avatar, ChatContext } from 'stream-chat-react';

import './TeamChannelPreview.css';

import { TeamTypingIndicator } from '../TeamTypingIndicator/TeamTypingIndicator';

export const TeamChannelPreview = (props) => {
  const { channel, setActiveChannel, type } = props;

  const { channel: activeChannel } = useContext(ChatContext);

  const ChannelPreview = () => (
    <p className="channel-preview__item"># {channel.data.id || 'random'}</p>
  );

  const DirectPreview = () => {
    const members = Object.values(channel.state.members);
    const defaultName = 'Johnny Blaze';

    if (!members.length || members.length === 1) {
      return (
        <div className="channel-preview__item single">
          <Avatar image={members[0]?.user.image || undefined} size={24} />
          <p>{members[0]?.user.name || defaultName}</p>
          <TeamTypingIndicator type="list" />
        </div>
      );
    }

    return (
      <div className="channel-preview__item multi">
        <Avatar image={members[0]?.user.image || undefined} size={18} />
        <Avatar image={members[1]?.user.image || undefined} size={18} />
        <p>
          {members[0]?.user.name || defaultName},{' '}
          {members[1]?.user.name || defaultName}
        </p>
      </div>
    );
  };

  return (
    <div
      className={
        channel?.id === activeChannel?.id
          ? 'channel-preview__wrapper__selected'
          : 'channel-preview__wrapper'
      }
      onClick={() => setActiveChannel(channel)}
    >
      {type === 'team' ? <ChannelPreview /> : <DirectPreview />}
    </div>
  );
};
