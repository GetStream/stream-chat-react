import React, { useContext, useEffect, useState } from 'react';
import { ChatContext } from 'stream-chat-react';

import './AgentChannelPreview.css';

export const AgentChannelPreview = (props) => {
  const {
    agentChannelId,
    channel,
    customerChannelId,
    setActiveChannel,
  } = props;

  const { channel: activeChannel, client } = useContext(ChatContext);
  const [unreadCount, setUnreadCount] = useState(channel.state.unreadCount);

  const selected = channel?.id === activeChannel?.id;

  useEffect(() => {
    client.on('message.read', () => setUnreadCount(0));
    return () => client.off('message.read');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    client.on('message.new', () => setUnreadCount(channel.state.unreadCount));
    return () => client.off('message.new');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const renderMessageText = () => {
    const lastMessageText =
      channel.state.messages[channel.state.messages.length - 1].text;

    return lastMessageText.length < 70
      ? lastMessageText
      : `${lastMessageText.slice(0, 70)}...`;
  };

  if (
    !channel.state.messages.length ||
    (channel.id !== agentChannelId && channel.id !== customerChannelId)
  )
    return null;

  return (
    <div
      className={
        selected
          ? 'agent-channel-preview__wrapper selected'
          : 'agent-channel-preview__wrapper'
      }
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
          <div className="agent-channel-preview__name-count-wrapper">
            <p className="agent-channel-preview__name">{channel.data.name}</p>
            {!!unreadCount && !selected && (
              <div className="agent-channel-preview__unread-count">
                {unreadCount}
              </div>
            )}
          </div>
          <p className="agent-channel-preview__text-inquiry">
            {channel.data.subtitle}
          </p>
        </div>
      </div>
      <p className="agent-channel-preview__message">{renderMessageText()}</p>
    </div>
  );
};
