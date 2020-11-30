import React, { useContext, useState } from 'react';
import { Channel, ChatContext } from 'stream-chat-react';

import './ChannelContainer.css';

import { ChannelInner } from './ChannelInner';

import { CreateChannel } from '../CreateChannel/CreateChannel';
import { EditChannel } from '../EditChannel/EditChannel';

export const ChannelContainer = (props) => {
  const {
    createType,
    isCreating,
    isEditing,
    setIsCreating,
    setIsEditing,
  } = props;

  const { channel } = useContext(ChatContext);

  const [pinsOpen, setPinsOpen] = useState(false);

  if (isCreating) {
    const filters = {};

    return (
      <div className="channel__container">
        <CreateChannel {...{ createType, filters, setIsCreating }} />
      </div>
    );
  }

  if (isEditing) {
    const filters = {};

    if (channel?.state?.members) {
      const channelMembers = Object.keys(channel.state.members);
      if (channelMembers.length) {
        filters.id = { $nin: channelMembers };
      }
    }

    return (
      <div className="channel__container">
        <EditChannel {...{ filters, setIsEditing }} />
      </div>
    );
  }

  return (
    <div className="channel__container">
      <Channel>
        <ChannelInner
          {...{
            pinsOpen,
            setIsEditing,
            setPinsOpen,
          }}
        />
      </Channel>
    </div>
  );
};
