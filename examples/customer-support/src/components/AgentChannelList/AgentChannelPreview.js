import React, { useContext } from 'react';
import { ChatContext } from 'stream-chat-react';

import './AgentChannelPreview.css';

export const AgentChannelPreview = ({ channel, setActiveChannel }) => {
  const { channel: activeChannel } = useContext(ChatContext);

  const renderMessageText = () => {
    const lastMessageText =
      channel.state.messages[channel.state.messages.length - 1].text;

    return lastMessageText.length < 70
      ? lastMessageText
      : `${lastMessageText.slice(0, 70)}...`;
  };

  if (!channel.state.messages.length) return null;

  return (
    <div
      className={'agent-channel-preview__wrapper'}
      // className={
      //   channel?.id === activeChannel?.id
      //     ? 'agent-channel-preview__wrapper__selected'
      //     : 'agent-channel-preview__wrapper'
      // }
      onClick={() => setActiveChannel(channel)}
    >
      <div className="agent-channel-preview__top">
        <div className="agent-channel-preview__image-wrapper">
          <img
            alt={channel.data.name}
            src={channel.data.image}
            height="36px"
            width="36px"
          />
        </div>
        <div className="agent-channel-preview__name-wrapper">
          <p className="agent-channel-preview__text">{channel.data.name}</p>
          <p className="agent-channel-preview__text-inquiry">
            {channel.data.subtitle}
          </p>
        </div>
      </div>
      <p className="agent-channel-preview__message">{renderMessageText()}</p>
    </div>
  );
};
