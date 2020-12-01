import React, { useContext, useEffect, useState } from 'react';
import { Avatar, ChannelContext } from 'stream-chat-react';

import './MessagingChannelHeader.css';

import { TypingIndicator } from '../TypingIndicator/TypingIndicator';

const MessagingChannelHeader = () => {
  const { channel, client } = useContext(ChannelContext);

  const [title, setTitle] = useState('');

  useEffect(() => {
    const currentUserId = client?.user?.id;
    const channelName = channel?.data?.name;
    if (channelName) return channelName;
    const members = Object.values(channel.state?.members || {});
    const otherMembers = members.filter(
      (member) => member.user?.id !== currentUserId,
    );
    return setTitle(
      otherMembers
        .map((member) => member.user?.name || member.user?.id || 'Unnamed User')
        .join(', '),
    );
  }, [channel.data.name, channel.state.members, client.user.id]);

  return (
    <div className="messaging__channel-header">
      <Avatar
        size={32}
        // name={displayTitle}
        // image={displayImage}
        // images={groupImages}
      />
      <div className="messaging__channel-header__right">
        <div className="channel-header__name">{title}</div>
        <TypingIndicator />
      </div>
    </div>
  );
};

export default React.memo(MessagingChannelHeader);
