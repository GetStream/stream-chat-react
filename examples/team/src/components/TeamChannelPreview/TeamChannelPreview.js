import React from 'react';
import { Avatar } from 'stream-chat-react';

import './TeamChannelPreview.css';

export const TeamChannelPreview = (props) => {
  const { channel, setActiveChannel, type } = props;

  const ChannelPreview = () => (
    <p className="channel-preview__item"># {channel.data.id || 'random'}</p>
  );

  const DirectPreview = () => {
    const members = Object.values(channel.state.members);

    return (
      <div className="channel-preview__item">
        <Avatar image={members[0]?.user.image || undefined} size={24} />
        <p>{members[0]?.user.name || 'Johnny Blaze'}</p>
      </div>
    );
  };

  return (
    <div
      className="channel-preview__wrapper"
      onClick={() => setActiveChannel(channel)}
    >
      {type === 'team' ? <ChannelPreview /> : <DirectPreview />}
    </div>
  );
};
