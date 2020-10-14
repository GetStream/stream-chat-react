import React, { useContext } from 'react';
import {
  Avatar,
  ChannelContext,
  getDisplayTitle,
  getDisplayImage,
  getGroupImages,
} from 'stream-chat-react';
import { MessagingTypingIndicator } from './MessagingTypingIndicator';
import './MessagingChannelHeader.css';

const MessagingChannelHeader = () => {
  const { channel, client } = useContext(ChannelContext);
  // const { openMobileNav } = useContext(ChatContext);

  const displayTitle = getDisplayTitle(channel, client.user);
  const displayImage = getDisplayImage(channel, client.user);
  const groupImages = getGroupImages(channel, client.user);

  return (
    <div className="messaging__channel-header">
      <Avatar
        size={32}
        name={displayTitle}
        image={displayImage}
        images={groupImages}
      />
      <div className="channel-header__name">{displayTitle}</div>
      <MessagingTypingIndicator />
    </div>
  );
};

export default React.memo(MessagingChannelHeader);
