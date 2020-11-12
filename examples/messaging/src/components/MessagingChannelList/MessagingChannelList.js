import React, { useContext } from 'react';
import {
  Avatar,
  ChatContext,
  ChatDown,
  LoadingChannels,
} from 'stream-chat-react';

import './MessagingChannelList.css';

import { CreateChannelIcon } from '../../assets';

const MessagingChannelList = ({
  error = false,
  loading,
  LoadingErrorIndicator = ChatDown,
  LoadingIndicator = LoadingChannels,
  children,
  onCreateChannel,
}) => {
  const { client } = useContext(ChatContext);
  const { id, image, name } = client.user || {};

  if (error) {
    return <LoadingErrorIndicator type="Connection Error" />;
  }

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="messaging__channel-list">
      <div className="messaging__channel-list__header">
        <Avatar image={image} name={name || id} size={40} />
        <div className="messaging__channel-list__header__name">
          {name || id}
        </div>
        <button
          className="messaging__channel-list__header__button"
          onClick={onCreateChannel}
        >
          <CreateChannelIcon />
        </button>
      </div>
      {children}
    </div>
  );
};

export default React.memo(MessagingChannelList);
