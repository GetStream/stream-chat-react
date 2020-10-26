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

    return (
      <div className="channel-preview__item">
        <Avatar image={members[0]?.user.image || undefined} size={24} />
        <p>{members[0]?.user.name || 'Johnny Blaze'}</p>
        <TeamTypingIndicator type="list" />
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
