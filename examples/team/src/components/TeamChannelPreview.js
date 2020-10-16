import React from 'react';
// import { Avatar } from 'stream-chat-react';

import './TeamChannelPreview.css';

export const TeamChannelPreview = (props) => {
  const { channel, setActiveChannel, type } = props;

  const ChannelPreview = () => (
    <p className="channel-preview__item"># {channel.data.id || 'random'}</p>
  );

  const DirectPreview = () => {
    const members = Object.values(channel.state.members);

    return (
      <>
        {/* <Avatar image={message.user.image} size={40} /> */}
        <p className="channel-preview__item">
          {members[0]?.user.name || 'Johnny Blaze'}
        </p>
      </>
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
