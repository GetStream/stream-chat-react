import React, { useContext, useState } from 'react';
import { ChatContext } from 'stream-chat-react';

import './CreateChannel.css';

import { UserList } from './UserList';

import { CloseCreateChannel } from '../../assets/CloseCreateChannel';

const ChannelNameInput = ({ channelName, setChannelName }) => {
  const handleChange = (event) => {
    event.preventDefault();
    setChannelName(event.target.value);
  };

  return (
    <div className="channel-name-input__wrapper">
      <p>Name</p>
      <input
        onChange={handleChange}
        placeholder="channel-name"
        type="text"
        value={channelName}
      />
      <p>Add Members</p>
    </div>
  );
};

export const CreateChannel = ({ createType, setIsCreating }) => {
  const { client, setActiveChannel } = useContext(ChatContext);

  const [channelName, setChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const createChannel = (event) => {
    event.preventDefault();
    console.log(channelName);
    console.log(selectedUsers);
    setChannelName('');
    setSelectedUsers([]);
  };

  return (
    <div className="create-channel__container">
      <div className="create-channel__header">
        <p>
          {createType === 'team'
            ? 'Create a New Channel'
            : 'Send a Direct Message'}
        </p>
        <CloseCreateChannel {...{ setIsCreating }} />
      </div>
      {createType === 'team' && (
        <ChannelNameInput {...{ channelName, setChannelName }} />
      )}
      <UserList setSelectedUsers={setSelectedUsers} />
      <div className="create-channel__button-wrapper" onClick={createChannel}>
        <p>Create Channel</p>
      </div>
    </div>
  );
};
